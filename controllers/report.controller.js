const PDFDocument = require("pdfkit");
const prisma = require("../libs/prisma");
const path = require("path");

const generateReport = async (req, res, next) => {
    try {
        const { deviceId, type, start, end } = req.query;

        let dateFilter = {};
        const now = new Date();

        if (type === "daily") {
            dateFilter = {
                gte: new Date(now.setHours(0, 0, 0, 0)),
                lte: new Date(now.setHours(23, 59, 59, 999)),
            };
        } else if (type === "weekly") {
            const firstDay = now.getDate() - now.getDay();
            dateFilter = {
                gte: new Date(now.setDate(firstDay)),
            };
        } else if (type === "monthly") {
            dateFilter = {
                gte: new Date(now.getFullYear(), now.getMonth(), 1),
            };
        } else if (start && end) {
            dateFilter = {
                gte: new Date(start),
                lte: new Date(end),
            };
        }

        const device = await prisma.device.findUnique({
            where: { id: parseInt(deviceId) },
        });

        const logs = await prisma.packingLog.findMany({
            where: {
                deviceId: parseInt(deviceId),
                createdAt: dateFilter,
            },
            orderBy: { createdAt: "asc" },
        });

        const doc = new PDFDocument({ margin: 50 });
        let filename = `Report_${device.name}_${type || 'custom'}.pdf`;

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=${filename}`);

        doc.pipe(res);

        // Header
        // Note: Assuming there's a logo in the public or assets folder
        // For now, we'll use text if image fails or just as placeholder
        doc.fontSize(25).text("COCOBASE PACKING REPORT", { align: "center" });
        doc.moveDown();

        doc.fontSize(12).text(`Device: ${device.name}`);
        doc.text(`Token ID: ${device.token}`);
        doc.text(`Report Period: ${type || 'Custom Period'}`);
        doc.text(`Generated At: ${new Date().toLocaleString()}`);
        doc.moveDown();

        // Table Header
        doc.fontSize(12).font("Helvetica-Bold");
        doc.text("No", 50, 200);
        doc.text("Date & Time", 100, 200);
        doc.text("Weight (kg)", 350, 200);
        doc.text("Status", 450, 200);

        doc.moveTo(50, 215).lineTo(550, 215).stroke();

        // Table Content
        doc.font("Helvetica").fontSize(10);
        let y = 225;
        logs.forEach((log, index) => {
            if (y > 700) {
                doc.addPage();
                y = 50;
            }
            doc.text(index + 1, 50, y);
            doc.text(new Date(log.createdAt).toLocaleString(), 100, y);
            doc.text(`${log.weight} kg`, 350, y);
            doc.text("Success", 450, y);
            y += 20;
        });

        doc.end();
    } catch (err) {
        next(err);
    }
};

module.exports = { generateReport };
