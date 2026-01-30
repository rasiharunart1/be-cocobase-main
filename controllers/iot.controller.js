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

    // Logic for triggering Packing Log
    if (weight >= device.threshold && device.isReady) {
      // Find active session for this device
      const activeSession = await prisma.deviceSession.findFirst({
        where: {
          deviceId: device.id,
          isActive: true
        }
      });

      await prisma.$transaction([
        prisma.packingLog.create({
          data: {
            weight: parseFloat(weight),
            deviceId: device.id,
            petaniId: activeSession?.petaniId || null
          }
        }),
        prisma.device.update({ where: { id: device.id }, data: { isReady: false } })
      ]);

      return res.status(200).json({ success: true, message: "Packing event recorded", alert: true });
    }

    return res.status(200).json({ success: true, message: "Reading recorded" });
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

module.exports = {
  getPackingLogs,
  getLatestLoadcellReading,
  ingestData,
  deletePackingLog,
  resetDeviceLogs
};
