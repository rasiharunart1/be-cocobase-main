const prisma = require('../libs/prisma');

// Helper: cek apakah device (by id) milik admin yang login
const requireDeviceOwner = async (deviceId, adminId, res) => {
  const device = await prisma.device.findUnique({ where: { id: parseInt(deviceId) } });
  if (!device) {
    res.status(404).json({ success: false, message: "Device tidak ditemukan" });
    return null;
  }
  if (device.id_admin !== adminId) {
    res.status(403).json({ success: false, message: "Forbidden! Device ini bukan milik Anda" });
    return null;
  }
  return device;
};

const getPackingLogs = async (req, res, next) => {
  try {
    const { deviceId } = req.params;
    const id_admin = req.user.id;

    const device = await requireDeviceOwner(deviceId, id_admin, res);
    if (!device) return;

    const logs = await prisma.packingLog.findMany({
      where: {
        deviceId: parseInt(deviceId),
        weight: { gt: 0 }
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: 50,
      include: { petani: true },
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
    const id_admin = req.user.id;

    const device = await requireDeviceOwner(deviceId, id_admin, res);
    if (!device) return;

    const reading = await prisma.loadcellReading.findFirst({
      where: { deviceId: parseInt(deviceId) },
      orderBy: { createdAt: 'desc' },
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

// ingestData: dipanggil oleh ESP32 via device token — tidak perlu JWT admin
// Token device sudah mengidentifikasi device dan admin pemiliknya
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
      return res.status(404).json({ success: false, message: "Device not found" });
    }

    const currentWeight = parseFloat(weight);
    const isRelayOn = req.body.isRelayOn === true || req.body.isRelayOn === "true";

    // ALWAYS save to loadcellReading for real-time monitoring
    await prisma.loadcellReading.create({
      data: { weight: currentWeight, deviceId: device.id, isRelayOn }
    });

    const RESET_THRESHOLD = 0.5;

    if (currentWeight <= RESET_THRESHOLD && !device.isReady) {
      await prisma.device.update({ where: { id: device.id }, data: { isReady: true } });
      await prisma.packingLog.create({
        data: { weight: 0, deviceId: device.id, notes: 'SESSION_START', createdAt: new Date() }
      });
      console.log("♻️  Session Reset: Ready for new batch");
    }

    if (isRelayOn && currentWeight > 0.05) {
      const threshold = parseFloat(device.threshold) || 5.0;
      const lastSessionStart = await prisma.packingLog.findFirst({
        where: { deviceId: device.id, notes: 'SESSION_START' },
        orderBy: { createdAt: 'desc' }
      });

      let sessionCumulative = 0.0;
      let searchDateFilter = {};

      if (lastSessionStart) {
        searchDateFilter = { gte: lastSessionStart.createdAt };
      } else {
        searchDateFilter = { gte: new Date(new Date() - 12 * 60 * 60 * 1000) };
      }

      const sessionLogs = await prisma.packingLog.findMany({
        where: { deviceId: device.id, petaniId: null, createdAt: searchDateFilter, notes: null }
      });

      sessionCumulative = sessionLogs.reduce((sum, log) => sum + parseFloat(log.weight), 0);

      const potentialDelta = currentWeight - sessionCumulative;
      const relayThreshold = parseFloat(device.relayThreshold) || 50.0;
      const isFinalLog = currentWeight >= relayThreshold;

      if (potentialDelta >= threshold || (isFinalLog && potentialDelta > 0.1)) {
        await prisma.packingLog.create({
          data: { weight: potentialDelta, deviceId: device.id, petaniId: null, createdAt: new Date() }
        });
        console.log(`📦 Log Created: ${potentialDelta.toFixed(2)}kg (Scale: ${currentWeight}kg | SessionBase: ${sessionCumulative.toFixed(2)}kg)${isFinalLog ? ' [FINAL]' : ''}`);
      }
    }

    const relayThreshold = parseFloat(device.relayThreshold) || 50.0;
    if (currentWeight >= relayThreshold && isRelayOn) {
      await prisma.device.update({ where: { id: device.id }, data: { isReady: false } });
      console.log(`🛑 Max threshold reached: ${currentWeight}kg`);
    }

    const aggregateTotal = await prisma.packingLog.aggregate({
      _sum: { weight: true },
      where: { deviceId: device.id, petaniId: null }
    });
    const totalRecorded = aggregateTotal._sum.weight || 0.0;

    let responsePayload = {
      success: true,
      message: "Reading recorded",
      threshold: device.threshold || 10.0,
      relayThreshold: device.relayThreshold || 50.0,
      totalWeight: totalRecorded
    };

    if (device.pendingCommand) {
      try {
        const command = JSON.parse(device.pendingCommand);
        responsePayload.command = command;
        responsePayload.message = "Command sent to device";
        await prisma.device.update({ where: { id: device.id }, data: { pendingCommand: null } });
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
    const id_admin = req.user.id;
    const { type, value } = req.body;

    const device = await requireDeviceOwner(deviceId, id_admin, res);
    if (!device) return;

    const updateData = { pendingCommand: JSON.stringify({ type, value }) };
    if (type === "CALIBRATE" && value) {
      updateData.calibrationFactor = parseFloat(value);
    }

    await prisma.device.update({ where: { id: parseInt(deviceId) }, data: updateData });

    res.status(200).json({ success: true, message: `Command ${type} queued for device` });
  } catch (err) {
    next(err);
  }
};

const deletePackingLog = async (req, res, next) => {
  try {
    const { id } = req.params;
    const id_admin = req.user.id;

    // Cek log ada dan device-nya milik admin ini
    const log = await prisma.packingLog.findUnique({
      where: { id: parseInt(id) },
      include: { device: { select: { id_admin: true } } }
    });

    if (!log) return res.status(404).json({ success: false, message: "Log not found" });
    if (log.device.id_admin !== id_admin) {
      return res.status(403).json({ success: false, message: "Forbidden! Log ini bukan milik Anda" });
    }

    await prisma.packingLog.delete({ where: { id: parseInt(id) } });
    res.status(200).json({ success: true, message: "Log deleted successfully" });
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
    const id_admin = req.user.id;

    const device = await requireDeviceOwner(deviceId, id_admin, res);
    if (!device) return;

    const id = parseInt(deviceId);
    await prisma.$transaction([
      prisma.packingLog.deleteMany({ where: { deviceId: id } }),
      prisma.loadcellReading.deleteMany({ where: { deviceId: id } }),
    ]);

    res.status(200).json({ success: true, message: "All logs for this device have been reset" });
  } catch (err) {
    next(err);
  }
};

const createPackingLog = async (req, res, next) => {
  try {
    const { token, weight } = req.body;

    if (!token || weight === undefined) {
      return res.status(400).json({ success: false, message: "Token and weight are required" });
    }

    const device = await prisma.device.findUnique({ where: { token } });
    if (!device) {
      return res.status(404).json({ success: false, message: "Device not found" });
    }

    const log = await prisma.packingLog.create({
      data: { weight: parseFloat(weight), deviceId: device.id, petaniId: null },
      include: { petani: true }
    });

    res.status(200).json({ success: true, message: "Packing recorded successfully", data: log });
  } catch (err) {
    next(err);
  }
};

const verifyPacking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { petaniId } = req.body;
    const id_admin = req.user.id;

    if (!petaniId) {
      return res.status(400).json({ success: false, message: "Petani ID is required" });
    }

    // Pastikan log dan petani keduanya milik admin yang sama
    const log = await prisma.packingLog.findUnique({
      where: { id: parseInt(id) },
      include: { device: { select: { id_admin: true } } }
    });
    if (!log) return res.status(404).json({ success: false, message: "Log not found" });
    if (log.device.id_admin !== id_admin) {
      return res.status(403).json({ success: false, message: "Forbidden! Log ini bukan milik Anda" });
    }

    const petani = await prisma.petani.findUnique({ where: { id: parseInt(petaniId) } });
    if (!petani || petani.id_admin !== id_admin) {
      return res.status(403).json({ success: false, message: "Forbidden! Petani ini bukan milik Anda" });
    }

    const updated = await prisma.packingLog.update({
      where: { id: parseInt(id) },
      data: { petaniId: parseInt(petaniId) },
      include: { petani: true }
    });

    res.status(200).json({ success: true, message: "Packing log verified and assigned successfully", data: updated });
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
  sendCommand,
};
