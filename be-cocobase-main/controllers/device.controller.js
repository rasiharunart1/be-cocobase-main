const prisma = require("../libs/prisma");
const { v4: uuidv4 } = require("uuid");

const getDevices = async (req, res, next) => {
    try {
        const devices = await prisma.device.findMany({
            orderBy: { createdAt: "desc" },
        });
        res.status(200).json({ success: true, data: devices });
    } catch (err) {
        next(err);
    }
};

const createDevice = async (req, res, next) => {
    try {
        const { name, threshold } = req.body;
        const token = uuidv4();
        const device = await prisma.device.create({
            data: {
                name,
                token,
                threshold: threshold ? parseFloat(threshold) : 10.0,
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
        const { name, threshold } = req.body;
        const device = await prisma.device.update({
            where: { id: parseInt(id) },
            data: {
                name,
                threshold: threshold ? parseFloat(threshold) : undefined,
            },
        });
        res.status(200).json({ success: true, data: device });
    } catch (err) {
        next(err);
    }
};

const deleteDevice = async (req, res, next) => {
    try {
        const { id } = req.params;
        await prisma.device.delete({
            where: { id: parseInt(id) },
        });
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
