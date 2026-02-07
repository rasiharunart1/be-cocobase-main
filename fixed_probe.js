require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Probing production database...");
    try {
        // 1. Check columns in Device table
        const columns = await prisma.$queryRaw`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'Device';
        `;
        console.log("Columns in Device table:", JSON.stringify(columns, null, 2));

        // 2. Try to fetch one device
        const device = await prisma.device.findFirst();
        console.log("Device fetch test:", device ? "Success" : "No devices found");
        if (device) {
            console.log("First device keys:", Object.keys(device));
        }

    } catch (error) {
        console.error("Error probing DB:", error.message);
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
