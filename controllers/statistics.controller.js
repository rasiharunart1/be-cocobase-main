const prisma = require('../libs/prisma');

const getPetaniStats = async (req, res, next) => {
    try {
        const { petaniId } = req.params;
        const id_admin = req.user.id;

        // Validasi bahwa petani ini milik admin yang login
        const petani = await prisma.petani.findUnique({
            where: { id: parseInt(petaniId) },
            select: { id: true, id_admin: true },
        });

        if (!petani) {
            return res.status(404).json({ success: false, message: 'Petani tidak ditemukan', data: null });
        }

        if (petani.id_admin !== id_admin) {
            return res.status(403).json({ success: false, message: 'Forbidden! Petani ini bukan milik Anda', data: null });
        }

        const stats = await prisma.packingLog.aggregate({
            where: { petaniId: parseInt(petaniId) },
            _count: { id: true },
            _sum: { weight: true },
            _avg: { weight: true },
        });

        // Get recent logs
        const recentLogs = await prisma.packingLog.findMany({
            where: { petaniId: parseInt(petaniId) },
            orderBy: { createdAt: 'desc' },
            take: 10,
            include: { device: true },
        });

        // Get recent production activities
        const productionActivities = await prisma.produksi.findMany({
            where: { id_petani: parseInt(petaniId) },
            orderBy: { createdAt: 'desc' },
            take: 10,
        });

        res.status(200).json({
            success: true,
            message: 'Farmer statistics retrieved',
            data: {
                totalPacking: stats._count.id,
                totalWeight: stats._sum.weight || 0,
                averageWeight: stats._avg.weight || 0,
                recentLogs,
                productionActivities,
            },
        });
    } catch (err) {
        next(err);
    }
};

const getLeaderboard = async (req, res, next) => {
    try {
        const id_admin = req.user.id;

        // Ambil hanya petani milik admin ini
        const petaniIds = await prisma.petani.findMany({
            where: { id_admin },
            select: { id: true },
        }).then(list => list.map(p => p.id));

        if (petaniIds.length === 0) {
            return res.status(200).json({ success: true, message: 'Leaderboard retrieved', data: [] });
        }

        const leaderboard = await prisma.packingLog.groupBy({
            by: ['petaniId'],
            _count: { id: true },
            _sum: { weight: true },
            where: { petaniId: { in: petaniIds, not: null } },
            orderBy: { _sum: { weight: 'desc' } },
            take: 10,
        });

        // Fetch petani details
        const leaderboardWithDetails = await Promise.all(
            leaderboard.map(async (entry, index) => {
                const petani = await prisma.petani.findUnique({
                    where: { id: entry.petaniId },
                    select: { id: true, nama: true, alamat: true },
                });
                return {
                    rank: index + 1,
                    petani,
                    totalPacking: entry._count.id,
                    totalWeight: entry._sum.weight,
                };
            })
        );

        res.status(200).json({
            success: true,
            message: 'Leaderboard retrieved',
            data: leaderboardWithDetails,
        });
    } catch (err) {
        next(err);
    }
};

const getAllPetaniStats = async (req, res, next) => {
    try {
        const id_admin = req.user.id;

        const allStats = await prisma.petani.findMany({
            where: { id_admin },
            include: {
                _count: { select: { packingLogs: true } },
            },
        });

        const petaniIds = allStats.map(p => p.id);

        const weightStats = petaniIds.length > 0
            ? await prisma.packingLog.groupBy({
                by: ['petaniId'],
                _sum: { weight: true },
                where: { petaniId: { in: petaniIds, not: null } },
              })
            : [];

        const formattedStats = allStats.map(petani => {
            const weightStat = weightStats.find(w => w.petaniId === petani.id);
            return {
                id: petani.id,
                nama: petani.nama,
                totalPacking: petani._count.packingLogs,
                totalWeight: weightStat?._sum.weight || 0,
            };
        }).sort((a, b) => b.totalWeight - a.totalWeight);

        res.status(200).json({
            success: true,
            message: 'All farmers statistics retrieved',
            data: formattedStats,
        });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getPetaniStats,
    getLeaderboard,
    getAllPetaniStats,
};
