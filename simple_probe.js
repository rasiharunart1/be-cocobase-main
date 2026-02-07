const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const result = await prisma.$queryRaw`SELECT table_name, column_name FROM information_schema.columns WHERE table_name = 'Device';`;
        const fs = require('fs');
        fs.writeFileSync('probe_results.txt', JSON.stringify(result, null, 2));
        console.log('Results written to probe_results.txt');
    } catch (error) {
        const fs = require('fs');
        fs.writeFileSync('probe_error.txt', error.stack);
    } finally {
        await prisma.$disconnect();
    }
}
main();
