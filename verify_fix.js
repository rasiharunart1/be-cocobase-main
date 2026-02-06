const prisma = require("./libs/prisma");

async function testReportQuery() {
    try {
        const deviceId = 1;
        const petaniId = 2;
        const start = "2026-02-06T00:00:00.000Z";
        const end = "2026-02-06T23:59:59.999Z";

        const dateFilter = {
            gte: new Date(start),
            lte: new Date(end),
        };

        let farmerFilter = {};
        if (petaniId) {
            farmerFilter.petaniId = parseInt(petaniId);
        }

        console.log("Running query with:");
        console.log("where:", {
            deviceId: parseInt(deviceId),
            createdAt: dateFilter,
            ...farmerFilter
        });

        const logs = await prisma.packingLog.findMany({
            where: {
                deviceId: parseInt(deviceId),
                createdAt: dateFilter,
                ...farmerFilter
            },
            orderBy: { createdAt: "asc" },
            include: {
                petani: true,
            },
        });

        console.log("Success! Found logs:", logs.length);
    } catch (err) {
        console.error("Query failed:");
        console.error(err);
    } finally {
        await prisma.$disconnect();
    }
}

testReportQuery();
