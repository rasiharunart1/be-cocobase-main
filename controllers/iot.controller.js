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

    /*
    // --- OLD LOGIC (EVENT BASED) ---
    // Only log when ESP32 explicitly sends "LOG" event
    const { event } = req.body;

    if (event === "LOG" && device.isReady) {
      // Create packing log automatically
      await prisma.packingLog.create({
        data: {
          weight: parseFloat(weight),
          deviceId: device.id,
          petaniId: null // Admin will assign farmer later via dropdown
        }
      });

      console.log(`Log created for device ${device.id} at weight ${weight}`);
    }
    */

    // --- MODE DELTA LOGGING (BACKEND GENERATED) ---

    // 1. Get Device Thresholds
    let threshold = parseFloat(device.threshold);
    if (!threshold || threshold < 0.1) threshold = 5.0; // Default safety

    const relayThreshold = parseFloat(device.relayThreshold) || 50.0;
    const currentWeight = parseFloat(weight);

    // 2. Get Last Log
    const latestLog = await prisma.packingLog.findFirst({
      where: { deviceId: device.id },
      orderBy: { createdAt: 'desc' }
    });

    let lastLoggedWeight = 0;

    if (latestLog) {
      if (currentWeight >= latestLog.weight) {
        lastLoggedWeight = parseFloat(latestLog.weight);
      } else {
        // Reset: Weight dropped significantly below last log
        lastLoggedWeight = 0;
      }
    }

    // Debugging
    console.log(`[IoT] Ingest: ${weight}kg. Last: ${lastLoggedWeight}kg. Th: ${threshold}kg.`);

    // 3. STRICT THRESHOLD LOGIC
    // Requirement: "Buat murni saja... setiap penambahan beban sesuai threshold web, maka buat lognya"
    // Logic: Only log if we have enough delta to fill a full THRESHOLD block.
    // Example: Th=5kg. Current=12kg. Logs: 5kg, 5kg. (Total 10kg). Remainder 2kg ignored until it reaches 5kg.

    // ONLY RUN LOGGING IF REQ says Machine is ON
    const isRelayOn = req.body.isRelayOn === true || req.body.isRelayOn === "true";

    // Calculate Current Batch Total (Sum of unassigned logs)
    const aggregate = await prisma.packingLog.aggregate({
      _sum: {
        weight: true
      },
      where: {
        deviceId: device.id,
        petaniId: null // Only count current active batch (unassigned)
      }
    });

    const currentBatchTotal = aggregate._sum.weight || 0.0;

    console.log(`[IoT] Weight: ${currentWeight}kg. BatchTotal: ${currentBatchTotal}kg. Th: ${threshold}kg.`);

    const logsToCreate = [];

    if (isRelayOn || currentWeight >= relayThreshold) {
      let delta = currentWeight - currentBatchTotal;

      // STRICT LOOP: Only create logs if Delta >= Threshold
      // We do NOT log small steps (0.1kg). We wait for the full bucket (5kg).

      let createdCount = 0;
      const MAX_CHUNKS = 50;

      while (delta >= threshold && createdCount < MAX_CHUNKS) {
        logsToCreate.push({
          weight: threshold, // ALWAYS log exact threshold amount
          deviceId: device.id,
          petaniId: null,
          createdAt: new Date()
        });
        delta -= threshold;
        createdCount++;
      }

      // STOP LOGIC (Max Threshold)
      // If we reached the RelayLimit, we MUST log the remainder to close the batch tally
      // even if it's less than threshold.
      if (currentWeight >= relayThreshold && delta > 0.1) {
        logsToCreate.push({
          weight: delta,
          deviceId: device.id,
          petaniId: null,
          createdAt: new Date()
        });
        console.log(`[IoT] Final Remainder Log: ${delta.toFixed(2)}kg`);
      }

      if (logsToCreate.length > 0) {
        console.log(`[IoT] Generated ${logsToCreate.length} strict chunks.`);
      }
    }

    // 5. Bulk Insert
    if (logsToCreate.length > 0) {
      await prisma.packingLog.createMany({
        data: logsToCreate
      });

      if (currentWeight >= relayThreshold) {
        await prisma.device.update({
          where: { id: device.id },
          data: { isReady: false }
        });
      }
    } else {
      if (currentWeight <= 0.5 && !device.isReady) {
        await prisma.device.update({
          where: { id: device.id },
          data: { isReady: true }
        });
      }
    }

    /* 
    // OLD LOGIC (COMMENTED OUT): 
    // Automatic packing log creation when threshold is reached
    // threshold: Auto-log threshold - creates log automatically when weight >= this value
    // relayThreshold: Relay control threshold - ESP32 uses this to stop relay/motor
    
    if (weight >= device.threshold && device.isReady) {
      // Create packing log automatically
      await prisma.packingLog.create({
        data: {
          weight: parseFloat(weight),
          deviceId: device.id,
          petaniId: null // Admin will assign farmer later via dropdown
        }
      });

      // Mark device as not ready to prevent duplicate logs
      await prisma.device.update({
        where: { id: device.id },
        data: { isReady: false }
      });
    }
    */

    // Check for pending command and return thresholds to ESP32
    let responsePayload = {
      success: true,
      message: "Reading recorded",
      threshold: device.threshold || 10.0,        // Auto-log threshold
      relayThreshold: device.relayThreshold || 10.0  // Relay stop threshold
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
