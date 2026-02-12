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
    if (currentWeight <= RESET_THRESHOLD && !device.isReady) {
      await prisma.device.update({
        where: { id: device.id },
        data: { isReady: true }
      });
    }

    // === REAL-TIME DELTA LOGGING (Corrected) ===
    // Log whenever weight increases by 'threshold' amount from the last logged state

    if (isRelayOn && currentWeight > 0.05) {
      const threshold = parseFloat(device.threshold) || 5.0;

      // 1. Detect Session (New or Existing)
      const recentLog = await prisma.packingLog.findFirst({
        where: {
          deviceId: device.id,
          petaniId: null
        },
        orderBy: { createdAt: 'desc' }
      });

      const now = new Date();
      const SESSION_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes break = new session
      const isNewSession = !recentLog ||
        (now - new Date(recentLog.createdAt)) > SESSION_TIMEOUT_MS;

      // 2. Calculate "Base Weight" (Sum of all previous logs in THIS session)
      let sessionCumulative = 0.0;

      if (!isNewSession) {
        // Get all logs for the current active session to calculate "recorded so far"
        // We look back enough time or fetch by session ID if we had one. 
        // For now, relying on time-based clustering.
        const sessionLogs = await prisma.packingLog.findMany({
          where: {
            deviceId: device.id,
            petaniId: null,
            createdAt: {
              // Look back a reasonable amount of time for the current session
              // or getting the gap-based session. 
              // Simpler approach: If not new session, sum all recent contiguous logs.
              gte: new Date(now - (12 * 60 * 60 * 1000)) // Max 12h session lookback safety
            }
          },
          orderBy: { createdAt: 'desc' }
        });

        // Filter functionally to find the continuous session block
        let activeSessionLogs = [];
        for (let i = 0; i < sessionLogs.length; i++) {
          const logTime = new Date(sessionLogs[i].createdAt);
          const prevLogTime = i < sessionLogs.length - 1 ? new Date(sessionLogs[i + 1].createdAt) : null;

          activeSessionLogs.push(sessionLogs[i]);

          // If gap to previous log is too big, stop (that was the start of session)
          if (prevLogTime && (logTime - prevLogTime) > SESSION_TIMEOUT_MS) {
            break;
          }
        }

        sessionCumulative = activeSessionLogs.reduce((sum, log) => sum + parseFloat(log.weight), 0);
      }

      // 3. Calculate Delta (Current Sensor Weight - What we have already logged)
      // Example: 
      // Logged so far: 5.0, 5.0 (Total 10.0)
      // Current Scale: 15.3
      // Delta: 15.3 - 10.0 = 5.3 -> Valid logic? 
      // Wait, your requirement: "Real-time" increments.
      // If threshold is 5kg.
      // 0 -> 5.1 (Log 5.1). Cumulative now 5.1.
      // 5.1 -> 10.3 (Delta = 10.3 - 5.1 = 5.2). Log 5.2. Cumulative now 10.3.
      // 10.3 -> 12.0 (Delta = 1.7). No log.

      const potentialDelta = currentWeight - sessionCumulative;

      if (potentialDelta >= threshold) {
        // Create the log with the EXACT delta (e.g. 5.1, 5.2, 6.3)
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
