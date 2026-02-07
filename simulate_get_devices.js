const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Simulating getDevices query...");
        const devices = await prisma.device.findMany({
            orderBy: { createdAt: "desc" },
        });
        console.log("SUCCESS: Fetched", devices.length, "devices.");
        console.log("First device sample:", JSON.stringify(devices[0], null, 2));
    } catch (error) {
        console.error("FAILED: getDevices query error:");
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}
main();
