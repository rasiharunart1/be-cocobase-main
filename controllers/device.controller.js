const prisma = require("../libs/prisma");
const crypto = require("crypto");

// Helper: cek apakah device milik admin yang login
// Device id_admin null = belum diklaim, bisa diakses (akan auto-claim saat diedit)
const checkDeviceOwnership = async (deviceId, adminId) => {
    const device = await prisma.device.findUnique({
        where: { id: parseInt(deviceId) },
    });
    if (!device) return { device: null, error: 'not_found' };
    if (device.id_admin !== null && device.id_admin !== adminId) return { device, error: 'forbidden' };
    return { device, error: null };
};

const getDevices = async (req, res, next) => {
    try {
        const id_admin = req.user.id;
        // Hanya tampilkan device milik admin ini
        const devices = await prisma.device.findMany({
            where: { id_admin },
            orderBy: { createdAt: "desc" },
        });
        res.status(200).json({ success: true, data: devices });
    } catch (err) {
        next(err);
    }
};

const createDevice = async (req, res, next) => {
    try {
        const id_admin = req.user.id;
        const { name, threshold } = req.body;
        const token = crypto.randomUUID();
        const device = await prisma.device.create({
            data: {
                name,
                token,
                id_admin,
                threshold: threshold ? parseFloat(threshold) : 10.0,
                relayThreshold: req.body.relayThreshold ? parseFloat(req.body.relayThreshold) : 10.0,
                calibrationFactor: 2280.0,
            },
        });
        res.status(201).json({ success: true, data: device });
    } catch (err) {
        next(err);
    }
};

const updateDevice = async (req, res, next) => {
    try {
        const { id } = req.params;
        const id_admin = req.user.id;

        const { device, error } = await checkDeviceOwnership(id, id_admin);
        if (error === 'not_found') return res.status(404).json({ success: false, message: "Device tidak ditemukan" });
        if (error === 'forbidden') return res.status(403).json({ success: false, message: "Forbidden! Device ini bukan milik Anda" });

        const { name, threshold } = req.body;
        const updated = await prisma.device.update({
            where: { id: parseInt(id) },
            data: {
                name,
                // Auto-claim: jika device belum punya pemilik, set id_admin sekarang
                id_admin: device.id_admin ?? id_admin,
                threshold: threshold ? parseFloat(threshold) : undefined,
                relayThreshold: req.body.relayThreshold ? parseFloat(req.body.relayThreshold) : undefined,
                calibrationFactor: req.body.calibrationFactor ? parseFloat(req.body.calibrationFactor) : undefined,
            },
        });
        res.status(200).json({ success: true, data: updated });
    } catch (err) {
        next(err);
    }
};

const deleteDevice = async (req, res, next) => {
    try {
        const { id } = req.params;
        const id_admin = req.user.id;

        const { error } = await checkDeviceOwnership(id, id_admin);
        if (error === 'not_found') return res.status(404).json({ success: false, message: "Device tidak ditemukan" });
        if (error === 'forbidden') return res.status(403).json({ success: false, message: "Forbidden! Device ini bukan milik Anda" });

        await prisma.device.delete({ where: { id: parseInt(id) } });
        res.status(200).json({ success: true, message: "Device deleted" });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getDevices,
    createDevice,
    updateDevice,
    deleteDevice,
};
