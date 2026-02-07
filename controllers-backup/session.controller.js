const prisma = require('../libs/prisma');

const startSession = async (req, res, next) => {
    try {
        const { deviceId, petaniId } = req.body;

        if (!deviceId || !petaniId) {
            return res.status(400).json({
                success: false,
                message: 'Device ID and Petani ID are required',
            });
        }

        // Check if there is already an active session for this device
        const activeSession = await prisma.deviceSession.findFirst({
            where: {
                deviceId: parseInt(deviceId),
                isActive: true,
            },
        });

        if (activeSession) {
            return res.status(400).json({
                success: false,
                message: 'There is already an active session for this device. Please end it first.',
                data: activeSession,
            });
        }

        const session = await prisma.deviceSession.create({
            data: {
                deviceId: parseInt(deviceId),
                petaniId: parseInt(petaniId),
                isActive: true,
            },
            include: {
                petani: true,
                device: true,
            },
        });

        res.status(201).json({
            success: true,
            message: 'Session started successfully',
            data: session,
        });
    } catch (err) {
        next(err);
    }
};

const endSession = async (req, res, next) => {
    try {
        const { deviceId } = req.params;

        // Find the active session
        const activeSession = await prisma.deviceSession.findFirst({
            where: {
                deviceId: parseInt(deviceId),
                isActive: true,
            },
        });

        if (!activeSession) {
            return res.status(404).json({
                success: false,
                message: 'No active session found for this device',
            });
        }

        const session = await prisma.deviceSession.update({
            where: {
                id: activeSession.id,
            },
            data: {
                isActive: false,
                endedAt: new Date(),
            },
        });

        res.status(200).json({
            success: true,
            message: 'Session ended successfully',
            data: session,
        });
    } catch (err) {
        next(err);
    }
};

const getActiveSession = async (req, res, next) => {
    try {
        const { deviceId } = req.params;

        const session = await prisma.deviceSession.findFirst({
            where: {
                deviceId: parseInt(deviceId),
                isActive: true,
            },
            include: {
                petani: true,
            },
        });

        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'No active session found',
                data: null
            });
        }

        res.status(200).json({
            success: true,
            message: 'Active session retrieved',
            data: session,
        });
    } catch (err) {
        next(err);
    }
};

const getSessionHistory = async (req, res, next) => {
    try {
        const { deviceId } = req.params;

        const sessions = await prisma.deviceSession.findMany({
            where: {
                deviceId: parseInt(deviceId),
            },
            orderBy: {
                startedAt: 'desc',
            },
            include: {
                petani: true,
            },
            take: 20,
        });

        res.status(200).json({
            success: true,
            message: 'Session history retrieved',
            data: sessions,
        });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    startSession,
    endSession,
    getActiveSession,
    getSessionHistory,
};
