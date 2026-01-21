const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const token = '16364003-4d58-41e3-9fb7-4b9d8897129f';
    const device = await prisma.device.findUnique({
        where: { token: token }
    });

    if (device) {
        console.log(`[SUCCESS] Device found: ${device.name} (Threshold: ${device.threshold}kg)`);
    } else {
        console.log(`[WARNING] Device with token ${token} not found. Creating a test device...`);
        const newDevice = await prisma.device.create({
            data: {
                name: "Test Device Loadcell",
                token: token,
                threshold: 10.0,
                isReady: true
            }
        });
        console.log(`[SUCCESS] Created new test device: ${newDevice.name}`);
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
