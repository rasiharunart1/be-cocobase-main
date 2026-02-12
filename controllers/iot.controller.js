const prisma = require('../libs/prisma');

// const saveLoadcellReading = async (req, res, next) => {
//   try {
//     const { weight } = req.body;

//     if (weight === undefined || weight === null) {
//       return res.status(400).json({
//         success: false,
//         message: 'Weight is required',
//         data: null,
//       });
//     }

//     const reading = await prisma.loadcellReading.create({
//       data: {
//         weight: parseFloat(weight),
//       },
//     });

//     res.status(201).json({
//       success: true,
//       message: 'Reading saved successfully',
//       data: reading,
//     });
//   } catch (err) {
//     next(err);
//   }
// };


const saveLoadcellReading = async (req, res) => {
  try {
    const { weight, isRelayOn } = req.body;

    if (weight === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Weight required'
      });
    }

    const w = Number(weight);

    // filtering noise & spike liar
    if (w < -2 || w > 300) return res.json({ success: true });

    await prisma.loadcellReading.create({
      data: {
        weight: w,
        relay: isRelayOn ?? false,
        status: 'Sukses'
      }
    });

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};

const getPackingLogs = async (req, res, next) => {
  try {
    const { deviceId } = req.params;
    const logs = await prisma.packingLog.findMany({
      where: { deviceId: parseInt(deviceId) },
      orderBy: [
        { createdAt: 'desc' },
        { id: 'desc' }
      ],
      take: 50,
      include: {
        petani: true
      }
    });

    res.status(200).json({
      success: true,
      message: 'Packing logs retrieved successfully',
      data: logs,
    });
  } catch (err) {
    next(err);
  }
};

const getLatestLoadcellReading = async (req, res, next) => {
  try {
    const { deviceId } = req.params;
    const reading = await prisma.loadcellReading.findFirst({
      where: { deviceId: parseInt(deviceId) },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.status(200).json({
      success: true,
      message: 'Latest reading retrieved successfully',
      data: reading,
    });
  } catch (err) {
    next(err);
  }
};

const ingestData = async (req, res, next) => {
  try {
    const { token, weight } = req.body;

    if (!token || weight === undefined) {
      return res.status(400).json({
        success: false,
        message: "Token and weight are required"
      });
    }

    const device = await prisma.device.findUnique({ where: { token } });
    if (!device) {
      return res.status(404).json({
        success: false,
        message: "Device not found"
      });
    }

    const currentWeight = parseFloat(weight);
    const isRelayOn = req.body.isRelayOn === true || req.body.isRelayOn === "true";

    // ALWAYS save to loadcellReading for real-time monitoring
    await prisma.loadcellReading.create({
      data: {
        weight: currentWeight,
        deviceId: device.id,
        isRelayOn: isRelayOn
      }
    });

    const RESET_THRESHOLD = 0.5;

    // Reset device to ready state when weight drops
    // This runs ONCE when the load is removed (transition from Not Ready -> Ready)
    if (currentWeight <= RESET_THRESHOLD && !device.isReady) {
      await prisma.device.update({
        where: { id: device.id },
        data: { isReady: true }
      });

      // Mark the start of a new session
      await prisma.packingLog.create({
        data: {
          weight: 0,
          deviceId: device.id,
          notes: 'SESSION_START',
          createdAt: new Date()
        }
      });
      console.log("♻️  Session Reset: Ready for new batch");
    }

    // === REAL-TIME DELTA LOGGING ===

    if (isRelayOn && currentWeight > 0.05) {
      const threshold = parseFloat(device.threshold) || 5.0;

      // 1. Find the start of the CURRENT session
      // We look for the last 'SESSION_START' marker. 
      // If none found (e.g. system just claimed), we fallback to time-based.
      const lastSessionStart = await prisma.packingLog.findFirst({
        where: {
          deviceId: device.id,
          notes: 'SESSION_START'
        },
        orderBy: { createdAt: 'desc' }
      });

      // 2. Calculate "Base Weight" (Sum of all logs SINCE the last session start)
      let sessionCumulative = 0.0;
      let searchDateFilter = {};

      if (lastSessionStart) {
        searchDateFilter = { gte: lastSessionStart.createdAt };
      } else {
        // Fallback: Last 12 hours if no explicit start marker found
        searchDateFilter = { gte: new Date(new Date() - 12 * 60 * 60 * 1000) };
      }

      const sessionLogs = await prisma.packingLog.findMany({
        where: {
          deviceId: device.id,
          petaniId: null,
          createdAt: searchDateFilter,
          notes: null // Exclude the marker itself (weight 0 anyway) or other metadata
        }
      });

      sessionCumulative = sessionLogs.reduce((sum, log) => sum + parseFloat(log.weight), 0);

      // 3. Calculate Delta
      // If we just reset, sessionCumulative is 0. 
      // If currentWeight is 5.1, delta is 5.1. Log it.
      // If currentWeight is 10.2, cumulative is 5.1 (from previous log). Delta is 5.1. Log it.

      const potentialDelta = currentWeight - sessionCumulative;

      // Ensure we don't log negative deltas (if weight fluctuates down slightly)
      // and ensure we meet the threshold.
      if (potentialDelta >= threshold) {
        await prisma.packingLog.create({
          data: {
            weight: potentialDelta,
            deviceId: device.id,
            petaniId: null,
            createdAt: new Date()
          }
        });

        console.log(`📦 Log Created: ${potentialDelta.toFixed(2)}kg (Scale: ${currentWeight}kg | SessionBase: ${sessionCumulative.toFixed(2)}kg)`);
      }
    }

    // Check if max threshold reached
    const relayThreshold = parseFloat(device.relayThreshold) || 50.0;
    if (currentWeight >= relayThreshold && isRelayOn) {
      await prisma.device.update({
        where: { id: device.id },
        data: { isReady: false }
      });
      console.log(`🛑 Max threshold reached: ${currentWeight}kg`);
    }

    // Return thresholds and any pending commands to ESP32
    let responsePayload = {
      success: true,
      message: "Reading recorded",
      threshold: device.threshold || 10.0,
      relayThreshold: device.relayThreshold || 50.0
    };

    // Handle pending commands (calibration, tare, etc.)
    if (device.pendingCommand) {
      try {
        const command = JSON.parse(device.pendingCommand);
        responsePayload.command = command;
        responsePayload.message = "Command sent to device";

        await prisma.device.update({
          where: { id: device.id },
          data: { pendingCommand: null }
        });
      } catch (e) {
        console.error("Failed to parse pending command", e);
      }
    }

    return res.status(200).json(responsePayload);
  } catch (err) {
    next(err);
  }
};

const sendCommand = async (req, res, next) => {
  try {
    const { deviceId } = req.params;
    const { type, value } = req.body; // type: "TARE" | "CALIBRATE", value: optional

    const command = { type, value };

    // If calibration, also update the stored factor in DB
    const updateData = {
      pendingCommand: JSON.stringify(command)
    };

    if (type === "CALIBRATE" && value) {
      updateData.calibrationFactor = parseFloat(value);
    }

    await prisma.device.update({
      where: { id: parseInt(deviceId) },
      data: updateData
    });

    res.status(200).json({
      success: true,
      message: `Command ${type} queued for device`
    });
  } catch (err) {
    next(err);
  }
};

const deletePackingLog = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.packingLog.delete({
      where: { id: parseInt(id) }
    });

    res.status(200).json({
      success: true,
      message: "Log deleted successfully"
    });
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ success: false, message: "Log not found" });
    }
    next(err);
  }
};

const resetDeviceLogs = async (req, res, next) => {
  try {
    const { deviceId } = req.params;
    const id = parseInt(deviceId);

    // Use transaction to delete both logs and raw readings
    await prisma.$transaction([
      prisma.packingLog.deleteMany({ where: { deviceId: id } }),
      prisma.loadcellReading.deleteMany({ where: { deviceId: id } })
    ]);

    res.status(200).json({
      success: true,
      message: "All logs for this device have been reset"
    });
  } catch (err) {
    next(err);
  }
};

const createPackingLog = async (req, res, next) => {
  try {
    const { token, weight } = req.body;

    if (!token || weight === undefined) {
      return res.status(400).json({
        success: false,
        message: "Token and weight are required"
      });
    }

    // Find device by token
    const device = await prisma.device.findUnique({ where: { token } });
    if (!device) {
      return res.status(404).json({
        success: false,
        message: "Device not found"
      });
    }

    // Create packing log without session requirement
    // petaniId is null, admin can assign later via verifyPacking endpoint
    const log = await prisma.packingLog.create({
      data: {
        weight: parseFloat(weight),
        deviceId: device.id,
        petaniId: null // Will be assigned by admin later
      },
      include: {
        petani: true
      }
    });

    res.status(200).json({
      success: true,
      message: "Packing recorded successfully",
      data: log
    });
  } catch (err) {
    next(err);
  }
};

const verifyPacking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { petaniId } = req.body;

    if (!petaniId) {
      return res.status(400).json({ success: false, message: "Petani ID is required" });
    }

    const log = await prisma.packingLog.update({
      where: { id: parseInt(id) },
      data: { petaniId: parseInt(petaniId) },
      include: { petani: true }
    });

    res.status(200).json({
      success: true,
      message: "Packing log verified and assigned successfully",
      data: log
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getPackingLogs,
  getLatestLoadcellReading,
  ingestData,
  createPackingLog,
  deletePackingLog,
  resetDeviceLogs,
  verifyPacking,
  sendCommand
};
