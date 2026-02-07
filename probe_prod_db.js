const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Probing production database...");
    try {
        // 1. Try to raw query to check columns
        const result = await prisma.$queryRaw`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'Device';`;
        console.log("Columns in Device table:", result);

        // 2. Try to fetch devices using Prisma Client (this verifies if Client schema matches DB)
        const devices = await prisma.device.findMany({
            take: 1
        });
        console.log("Successfully fetched devices:", devices);

    } catch (error) {
        console.error("Error probing DB:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
