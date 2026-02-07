require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

function log(msg) {
    console.log(msg);
    fs.appendFileSync('probe_v4.txt', msg + "\n");
}

async function main() {
    if (fs.existsSync('probe_v4.txt')) fs.unlinkSync('probe_v4.txt');
    log("Probing production database - v4...");
    try {
        log("Testing connection...");
        await prisma.$connect();
        log("Connection successful.");

        // 1. Check columns in Device table
        log("Querying information_schema...");
        const columns = await prisma.$queryRaw`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'Device';
        `;
        log("Columns in Device table: " + JSON.stringify(columns, null, 2));

        // 2. Try to fetch one device
        log("Fetching first device...");
        const device = await prisma.device.findFirst();
        log("Device fetch test: " + (device ? "Success" : "No devices found"));
        if (device) {
            log("First device keys: " + Object.keys(device).join(", "));
        }

    } catch (error) {
        log("Error: " + error.message);
        log(error.stack);
    } finally {
        log("Probe finished.");
        await prisma.$disconnect();
    }
}

main();
