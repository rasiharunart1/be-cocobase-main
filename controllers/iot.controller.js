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
        deviceId: device.id,
        isRelayOn: isRelayOn  // Track relay state for session detection
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

    // === MULTI-SESSION DELTA LOGGING ===
    // Session Detection: New session if gap > 5 minutes OR relay was OFF → ON
    // Delta Calculation: Within current session (proper deltas: 5.1kg, 5.2kg, 4.9kg...)
    // Cumulative Tracking: Across ALL sessions for milestone numbering

    if (isRelayOn && currentWeight > 0.05) {
      const threshold = parseFloat(device.threshold) || 5.0;

      // 1. Get total cumulative weight from ALL logs (for milestone tracking)
      const aggregate = await prisma.packingLog.aggregate({
        _sum: { weight: true },
        where: {
          deviceId: device.id,
          petaniId: null
        }
      });
      const totalCumulative = aggregate._sum.weight || 0.0;

      // 2. Detect session boundary
      const recentReading = await prisma.loadcellReading.findFirst({
        where: {
          deviceId: device.id
        },
        orderBy: { createdAt: 'desc' },
        skip: 1 // Get previous reading to check relay state
      });

      const now = new Date();
      const SESSION_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

      // New session conditions:
      // - No recent reading exists (first time)
      // - Gap > 5 minutes since last reading
      // - Relay was OFF in previous reading (relay state change OFF → ON)
      const wasRelayOff = recentReading ? (recentReading.isRelayOn === false) : false;
      const hasTimeGap = recentReading ? ((now - new Date(recentReading.createdAt)) > SESSION_TIMEOUT_MS) : false;
      const isNewSession = !recentReading || hasTimeGap || wasRelayOff;

      // 3. Get session base (cumulative weight logged in current session)
      let sessionBase = 0;

      if (!isNewSession) {
        // Sum all deltas logged in current session
        const sessionLogs = await prisma.packingLog.findMany({
          where: {
            deviceId: device.id,
            petaniId: null,
            createdAt: {
              gte: new Date(now - SESSION_TIMEOUT_MS)
            }
          }
        });
        sessionBase = sessionLogs.reduce((sum, log) => sum + parseFloat(log.weight), 0);
      }

      // 4. Calculate delta from session base
      const delta = currentWeight - sessionBase;

      // 5. Check if delta crossed threshold
      if (delta >= threshold) {
        // Calculate new cumulative total
        const newTotalCumulative = totalCumulative + delta;
        const currentMilestone = Math.floor(newTotalCumulative / threshold);

        // Log the delta
        await prisma.packingLog.create({
          data: {
            weight: delta,
            deviceId: device.id,
            petaniId: null,
            notes: isNewSession ? 'Session 2 (NEW)' : null,
            createdAt: new Date()
          }
        });

        console.log(`📦 Milestone ${currentMilestone}: Delta = ${delta.toFixed(2)}kg | Current: ${currentWeight.toFixed(2)}kg | SessionBase: ${sessionBase.toFixed(2)}kg | TotalCum: ${newTotalCumulative.toFixed(2)}kg${isNewSession ? ' [NEW SESSION]' : ''}`);
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
