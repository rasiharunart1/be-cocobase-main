const PDFDocument = require("pdfkit");
const prisma = require("../libs/prisma");
const path = require("path");

const generateReport = async (req, res, next) => {
    try {
        const { deviceId, type, start, end, petaniId } = req.query;

        // Get user info from JWT token (if available)
        const userName = req.user?.nama || req.user?.name || "Sistem";
        const userEmail = req.user?.email || "-";

        let dateFilter = {};
        const now = new Date();
        let periodLabel = "Periode Kustom";

        if (type === "daily") {
            const startOfDay = new Date(now);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(now);
            endOfDay.setHours(23, 59, 59, 999);
            dateFilter = {
                gte: startOfDay,
                lte: endOfDay,
            };
            periodLabel = `Harian (${startOfDay.toLocaleDateString("id-ID")})`;
        } else if (type === "weekly") {
            const firstDay = new Date(now);
            firstDay.setDate(now.getDate() - now.getDay());
            firstDay.setHours(0, 0, 0, 0);
            dateFilter = {
                gte: firstDay,
            };
            periodLabel = `Mingguan (Mulai ${firstDay.toLocaleDateString("id-ID")})`;
        } else if (type === "monthly") {
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            dateFilter = {
                gte: monthStart,
            };
            periodLabel = `Bulanan (${monthStart.toLocaleDateString("id-ID", { month: "long", year: "numeric" })})`;
        } else if (start && end) {
            dateFilter = {
                gte: new Date(start),
                lte: new Date(end),
            };
            periodLabel = `${new Date(start).toLocaleDateString("id-ID")} - ${new Date(end).toLocaleDateString("id-ID")}`;
        }

        const device = await prisma.device.findUnique({
            where: { id: parseInt(deviceId) },
        });

        if (!device) {
            return res.status(404).json({ success: false, message: "Perangkat tidak ditemukan" });
        }

        let farmerName = "Semua Petani";
        let farmerFilter = {};
        if (petaniId && petaniId !== "undefined" && petaniId !== "") {
            const farmer = await prisma.petani.findUnique({
                where: { id: parseInt(petaniId) },
            });
            if (farmer) {
                farmerName = farmer.nama;
                farmerFilter.petaniId = parseInt(petaniId);
            }
        }

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

        // Calculate summary statistics
        const totalRecords = logs.length;
        const totalWeight = logs.reduce((sum, log) => sum + log.weight, 0);
        const avgWeight = totalRecords > 0 ? totalWeight / totalRecords : 0;
        const firstLog = logs.length > 0 ? logs[0] : null;
        const lastLog = logs.length > 0 ? logs[logs.length - 1] : null;

        const doc = new PDFDocument({ margin: 50 });
        let filename = `Laporan_${device.name}_${type || 'custom'}.pdf`;

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=${filename}`);

        doc.pipe(res);

        // ============ HEADER ============
        doc.fontSize(22).font("Helvetica-Bold").text("COCOBASE", { align: "center" });
        doc.fontSize(14).font("Helvetica").text("Laporan Packing", { align: "center" });
        doc.moveDown(0.5);
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();

        // ============ REPORT INFO ============
        doc.fontSize(10).font("Helvetica");
        doc.text(`Nama Perangkat: ${device.name}`, 50);
        doc.text(`Token Perangkat: ${device.token}`);
        doc.text(`Periode Laporan: ${periodLabel}`);
        doc.text(`Filter Petani: ${farmerName}`);
        doc.moveDown(0.5);
        doc.text(`Dibuat Oleh: ${userName} (${userEmail})`);
        doc.text(`Dibuat Pada: ${new Date().toLocaleString("id-ID")}`);
        doc.moveDown();

        // ============ SUMMARY BOX ============
        const summaryY = doc.y;
        doc.rect(50, summaryY, 500, 80).fillAndStroke("#f9fafb", "#e5e7eb");

        doc.fillColor("#000000").fontSize(11).font("Helvetica-Bold");
        doc.text("RINGKASAN", 60, summaryY + 10);

        doc.fontSize(10).font("Helvetica");
        doc.text(`Total Data: ${totalRecords}`, 60, summaryY + 30);
        doc.text(`Total Berat: ${totalWeight.toFixed(2)} kg`, 60, summaryY + 45);
        doc.text(`Rata-rata Berat: ${avgWeight.toFixed(2)} kg`, 60, summaryY + 60);

        doc.text(`Target Batas: ${device.threshold} kg`, 300, summaryY + 30);
        if (firstLog) {
            doc.text(`Data Pertama: ${new Date(firstLog.createdAt).toLocaleString("id-ID")}`, 300, summaryY + 45);
        }
        if (lastLog) {
            doc.text(`Data Terakhir: ${new Date(lastLog.createdAt).toLocaleString("id-ID")}`, 300, summaryY + 60);
        }

        doc.y = summaryY + 95;
        doc.moveDown();

        // ============ TABLE HEADER ============
        const tableTop = doc.y;
        doc.fontSize(10).font("Helvetica-Bold").fillColor("#374151");
        doc.text("No", 50, tableTop);
        doc.text("Waktu", 80, tableTop);
        doc.text("Berat (kg)", 280, tableTop);
        doc.text("Petani", 380, tableTop);
        doc.text("Status", 480, tableTop);

        doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke("#d1d5db");

        // ============ TABLE CONTENT ============
        doc.font("Helvetica").fontSize(9).fillColor("#000000");
        let y = tableTop + 25;

        if (logs.length === 0) {
            doc.text("Tidak ada data untuk periode ini.", 50, y);
        } else {
            logs.forEach((log, index) => {
                if (y > 720) {
                    doc.addPage();
                    y = 50;
                }
                doc.text(String(index + 1), 50, y);
                doc.text(new Date(log.createdAt).toLocaleString("id-ID"), 80, y);
                doc.text(`${log.weight.toFixed(2)} kg`, 280, y);
                doc.text(log.petani ? log.petani.nama : "-", 380, y);
                doc.fillColor("#059669").text("Sukses", 480, y);
                doc.fillColor("#000000");
                y += 18;
            });
        }

        // ============ FOOTER ============
        doc.fontSize(8).fillColor("#9ca3af");
        doc.text(
            `Cocobase IoT Packing System - Halaman 1`,
            50,
            750,
            { align: "center", width: 500 }
        );

        doc.end();
    } catch (err) {
        next(err);
    }
};

module.exports = { generateReport };
