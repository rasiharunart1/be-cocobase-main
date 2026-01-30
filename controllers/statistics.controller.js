const prisma = require('../libs/prisma');

const getPetaniStats = async (req, res, next) => {
    try {
        const { petaniId } = req.params;

        const stats = await prisma.packingLog.aggregate({
            where: {
                petaniId: parseInt(petaniId),
            },
            _count: {
                id: true,
            },
            _sum: {
                weight: true,
            },
            _avg: {
                weight: true,
            },
        });

        // Get recent logs
        const recentLogs = await prisma.packingLog.findMany({
            where: {
                petaniId: parseInt(petaniId),
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: 10,
            include: {
                device: true
            }
        });

        res.status(200).json({
            success: true,
            message: 'Farmer statistics retrieved',
            data: {
                totalPacking: stats._count.id,
                totalWeight: stats._sum.weight || 0,
                averageWeight: stats._avg.weight || 0,
                recentLogs
            },
        });
    } catch (err) {
        next(err);
    }
};

const getLeaderboard = async (req, res, next) => {
    try {
        // Group by petaniId and count packing logs
        const leaderboard = await prisma.packingLog.groupBy({
            by: ['petaniId'],
            _count: {
                id: true,
            },
            _sum: {
                weight: true,
            },
            where: {
                petaniId: {
                    not: null
                }
            },
            orderBy: {
                _sum: {
                    weight: 'desc',
                },
            },
            take: 10,
        });

        // Manually fetch petani details since groupBy doesn't support include
        const leaderboardWithDetails = await Promise.all(
            leaderboard.map(async (entry, index) => {
                const petani = await prisma.petani.findUnique({
                    where: { id: entry.petaniId },
                    select: { id: true, nama: true, alamat: true }
                });

                return {
                    rank: index + 1,
                    petani,
                    totalPacking: entry._count.id,
                    totalWeight: entry._sum.weight
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
        const allStats = await prisma.petani.findMany({
            include: {
                _count: {
                    select: { packingLogs: true }
                },
            }
        });

        // Calculate total weight manually or via another query if needed
        // For simplicity, we'll fetch basic stats here

        // To get total weight per farmer properly:
        const weightStats = await prisma.packingLog.groupBy({
            by: ['petaniId'],
            _sum: {
                weight: true,
            },
            where: {
                petaniId: {
                    not: null
                }
            },
        });

        const formattedStats = allStats.map(petani => {
            const weightStat = weightStats.find(w => w.petaniId === petani.id);
            return {
                id: petani.id,
                nama: petani.nama,
                totalPacking: petani._count.packingLogs,
                totalWeight: weightStat?._sum.weight || 0,
            };
        }).sort((a, b) => b.totalWeight - a.totalWeight); // Sort by effectiveness

        res.status(200).json({
            success: true,
            message: 'All farmers statistics retrieved',
            data: formattedStats
        });

    } catch (err) {
        next(err);
    }
}


module.exports = {
    getPetaniStats,
    getLeaderboard,
    getAllPetaniStats
};
