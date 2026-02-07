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
      orderBy: {
        createdAt: 'desc',
      },
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
      return res.status(400).json({ success: false, message: "Token and weight are required" });
    }

    const device = await prisma.device.findUnique({ where: { token } });
    if (!device) {
      return res.status(404).json({ success: false, message: "Device not found" });
    }

    // Save reading
    await prisma.loadcellReading.create({
      data: { weight: parseFloat(weight), deviceId: device.id }
    });

    const RESET_THRESHOLD = 0.5;

    // Logic for resetting isReady
    if (weight <= RESET_THRESHOLD && !device.isReady) {
      await prisma.device.update({
        where: { id: device.id },
        data: { isReady: true }
      });
      return res.status(200).json({ success: true, message: "Device reset to ready" });
    }

    // Removed automatic packing log creation
    // Packing logs are now created manually via /loadcell/pack endpoint

    // Check for pending command
    let responsePayload = {
      success: true,
      message: "Reading recorded",
      threshold: device.threshold || 5.0,
      relayThreshold: device.relayThreshold || 10.0
    };

    if (device.pendingCommand) {
      try {
        const command = JSON.parse(device.pendingCommand);
        responsePayload.command = command;
        responsePayload.message = "Command sent to device";

        // Clear pending command after sending
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

    // Check for active session
    const activeSession = await prisma.deviceSession.findFirst({
      where: {
        deviceId: device.id,
        isActive: true
      }
    });

    if (!activeSession) {
      return res.status(400).json({
        success: false,
        message: "No active session. Please start a session first."
      });
    }

    // Create packing log with petaniId from session
    const log = await prisma.packingLog.create({
      data: {
        weight: parseFloat(weight),
        deviceId: device.id,
        petaniId: activeSession.petaniId
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
