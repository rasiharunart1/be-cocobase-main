const prisma = require('../libs/prisma');

const saveLoadcellReading = async (req, res, next) => {
  try {
    const { weight } = req.body;

    if (weight === undefined || weight === null) {
      return res.status(400).json({
        success: false,
        message: 'Weight is required',
        data: null,
      });
    }

    const reading = await prisma.loadcellReading.create({
      data: {
        weight: parseFloat(weight),
      },
    });

    res.status(201).json({
      success: true,
      message: 'Reading saved successfully',
      data: reading,
    });
  } catch (err) {
    next(err);
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

    // ALWAYS save to loadcellReading for real-time monitoring
    await prisma.loadcellReading.create({
      data: {
        weight: currentWeight,
        deviceId: device.id
      }
    });

    const RESET_THRESHOLD = 0.5;
    const isRelayOn = req.body.isRelayOn === true || req.body.isRelayOn === "true";

    // Reset device to ready state when weight drops
    if (currentWeight <= RESET_THRESHOLD && !device.isReady) {
      await prisma.device.update({
        where: { id: device.id },
        data: { isReady: true }
      });
    }

    // === DELTA-BASED MILESTONE LOGGING ===
    // Only create packingLog when crossing threshold milestones
    // Save DELTA (weight change), not absolute weight

    if (isRelayOn && currentWeight > 0.05) {
      const threshold = parseFloat(device.threshold) || 5.0;

      // Get last packing log for this device
      const lastLog = await prisma.packingLog.findFirst({
        where: {
          deviceId: device.id,
          petaniId: null  // Only count current session (unassigned logs)
        },
        orderBy: { createdAt: 'desc' }
      });

      // Calculate current milestone and last milestone
      const lastWeight = lastLog ? parseFloat(lastLog.weight) : 0;

      // Calculate cumulative weight (sum of all deltas in current session)
      const aggregate = await prisma.packingLog.aggregate({
        _sum: { weight: true },
        where: {
          deviceId: device.id,
          petaniId: null
        }
      });
      const cumulativeWeight = aggregate._sum.weight || 0.0;

      // Check if we've crossed a new threshold milestone
      const currentMilestone = Math.floor(currentWeight / threshold);
      const lastMilestone = Math.floor(cumulativeWeight / threshold);

      if (currentMilestone > lastMilestone) {
        // Calculate DELTA (weight change since last log)
        const delta = currentWeight - cumulativeWeight;

        await prisma.packingLog.create({
          data: {
            weight: delta,  // Save DELTA, not absolute weight!
            deviceId: device.id,
            petaniId: null,
            createdAt: new Date()
          }
        });

        console.log(`📦 Milestone ${currentMilestone}: Delta = ${delta.toFixed(2)}kg (Current: ${currentWeight}kg, Cumulative: ${(cumulativeWeight + delta).toFixed(2)}kg)`);
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
