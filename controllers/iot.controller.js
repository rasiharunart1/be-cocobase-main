const prisma = require('../libs/prisma');

/* =========================
   RAW LOADCELL SAVE
========================= */
const saveLoadcellReading = async (req, res, next) => {
  try {
    const { weight, deviceId, isRelayOn } = req.body;

    if (weight === undefined || deviceId === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Weight and deviceId are required',
        data: null,
      });
    }

    const reading = await prisma.loadcellReading.create({
      data: {
        weight: parseFloat(weight),
        deviceId: parseInt(deviceId),
        isRelayOn: Boolean(isRelayOn),
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

/* =========================
   GET PACKING LOGS
========================= */
const getPackingLogs = async (req, res, next) => {
  try {
    const { deviceId } = req.params;

    const logs = await prisma.packingLog.findMany({
      where: { deviceId: parseInt(deviceId) },
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

/* =========================
   GET LATEST READING
========================= */
const getLatestLoadcellReading = async (req, res, next) => {
  try {
    const { deviceId } = req.params;

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

/* =========================
   INGEST DATA (CORE)
========================= */
const ingestData = async (req, res, next) => {
  try {
    const { token, weight, isRelayOn: relayState } = req.body;

    if (!token || weight === undefined) {
      return res.status(400).json({
        success: false,
        message: "Token and weight are required",
      });
    }

    const device = await prisma.device.findUnique({ where: { token } });

    if (!device) {
      return res.status(404).json({
        success: false,
        message: "Device not found",
      });
    }

    const currentWeight = parseFloat(weight);
    const isRelayOn = relayState === true || relayState === "true";

    /* ===== 1. SAVE RAW READING ===== */
    await prisma.loadcellReading.create({
      data: {
        weight: currentWeight,
        deviceId: device.id,
        isRelayOn,
      },
    });

    /* ===== 2. RESET READY FLAG ===== */
    const RESET_THRESHOLD = 0.5;

    if (currentWeight <= RESET_THRESHOLD && device.isReady === false) {
      await prisma.device.update({
        where: { id: device.id },
        data: {
          isReady: true,
          lastLoggedWeight: 0,
        },
      });
    }

    /* ===== 3. DELTA LOGGING ===== */
    if (isRelayOn && device.isReady && currentWeight > 0.1) {
      const threshold = parseFloat(device.threshold) || 5.0;

      const delta = currentWeight - device.lastLoggedWeight;

      if (delta >= threshold) {
        await prisma.$transaction([
          prisma.packingLog.create({
            data: {
              weight: delta,
              deviceId: device.id,
              petaniId: null,
            },
          }),
          prisma.device.update({
            where: { id: device.id },
            data: {
              lastLoggedWeight: currentWeight,
            },
          }),
        ]);

        console.log(`📦 LOG ${delta.toFixed(2)}kg | Total ${currentWeight.toFixed(2)}kg`);
      }
    }

    /* ===== 4. MAX RELAY THRESHOLD ===== */
    const relayThreshold = parseFloat(device.relayThreshold) || 50;

    if (currentWeight >= relayThreshold && isRelayOn) {
      await prisma.device.update({
        where: { id: device.id },
        data: { isReady: false },
      });

      console.log(`🛑 RELAY STOP: ${currentWeight}kg`);
    }

    /* ===== 5. COMMAND HANDLING ===== */
    let responsePayload = {
      success: true,
      message: "Reading recorded",
      threshold: device.threshold || 5,
      relayThreshold: device.relayThreshold || 50,
    };

    if (device.pendingCommand) {
      try {
        const command = JSON.parse(device.pendingCommand);

        responsePayload.command = command;
        responsePayload.message = "Command sent";

        await prisma.device.update({
          where: { id: device.id },
          data: { pendingCommand: null },
        });
      } catch (e) {
        console.error("Failed parsing pendingCommand", e);
      }
    }

    return res.status(200).json(responsePayload);
  } catch (err) {
    console.error("INGEST ERROR:", err);
    next(err);
  }
};

/* =========================
   SEND DEVICE COMMAND
========================= */
const sendCommand = async (req, res, next) => {
  try {
    const { deviceId } = req.params;
    const { type, value } = req.body;

    const command = { type, value };

    const updateData = {
      pendingCommand: JSON.stringify(command),
    };

    if (type === "CALIBRATE" && value) {
      updateData.calibrationFactor = parseFloat(value);
    }

    await prisma.device.update({
      where: { id: parseInt(deviceId) },
      data: updateData,
    });

    res.status(200).json({
      success: true,
      message: `Command ${type} queued`,
    });
  } catch (err) {
    next(err);
  }
};

/* =========================
   DELETE LOG
========================= */
const deletePackingLog = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.packingLog.delete({
      where: { id: parseInt(id) },
    });

    res.status(200).json({
      success: true,
      message: "Log deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};

/* =========================
   RESET DEVICE LOGS
========================= */
const resetDeviceLogs = async (req, res, next) => {
  try {
    const { deviceId } = req.params;

    await prisma.$transaction([
      prisma.packingLog.deleteMany({ where: { deviceId: parseInt(deviceId) } }),
      prisma.loadcellReading.deleteMany({ where: { deviceId: parseInt(deviceId) } }),
      prisma.device.update({
        where: { id: parseInt(deviceId) },
        data: {
          lastLoggedWeight: 0,
          isReady: true,
        },
      }),
    ]);

    res.status(200).json({
      success: true,
      message: "All logs reset",
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  saveLoadcellReading,
  getPackingLogs,
  getLatestLoadcellReading,
  ingestData,
  sendCommand,
  deletePackingLog,
  resetDeviceLogs,
};
