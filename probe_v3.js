require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

async function main() {
    let log = "Probing production database...\n";
    try {
        // 1. Check columns in Device table
        const columns = await prisma.$queryRaw`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'Device';
        `;
        log += "Columns in Device table: " + JSON.stringify(columns, null, 2) + "\n";

        // 2. Try to fetch one device
        const device = await prisma.device.findFirst();
        log += "Device fetch test: " + (device ? "Success" : "No devices found") + "\n";
        if (device) {
            log += "First device keys: " + Object.keys(device).join(", ") + "\n";
        }

    } catch (error) {
        log += "Error probing DB: " + error.message + "\n";
        log += error.stack + "\n";
    } finally {
        fs.writeFileSync('probe_v3.txt', log);
        await prisma.$disconnect();
    }
}

main();
