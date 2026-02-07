const prisma = require("../libs/prisma");

// Enum untuk status produksi
const STATUS = {
  DIAYAK: "DIAYAK",
  DIOVEN: "DIOVEN",
  DISORTIR: "DISORTIR",
  DIKEMAS: "DIKEMAS",
  SELESAI: "SELESAI",
};

// Fungsi utilitas untuk menghitung jumlah data berdasarkan bulan
const getCountByMonth = async (model, monthOffset = 0) => {
  const startDate = new Date(new Date().getFullYear(), new Date().getMonth() + monthOffset, 1);
  const endDate = new Date(new Date().getFullYear(), new Date().getMonth() + monthOffset + 1, 0);

  return await model.count({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
  });
};

// Fungsi utilitas untuk menghitung jumlah produk berdasarkan bulan
const getProdukByMonth = async (monthOffset = 0) => {
  const startDate = new Date(new Date().getFullYear(), new Date().getMonth() + monthOffset, 1);
  const endDate = new Date(new Date().getFullYear(), new Date().getMonth() + monthOffset + 1, 0);

  const produk = await prisma.transaksi.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  return produk.reduce((total, produk) => total + produk.jumlah, 0);
};

// Fungsi utama untuk mengambil data dashboard
const dashboardAtas = async (req, res, next) => {
  try {
    // Mengambil data petani
    const [petaniTotal, petaniBulanIni, petaniBulanSebelumnya] = await Promise.all([
      prisma.petani.aggregate({ _count: { id: true } }),
      getCountByMonth(prisma.petani),
      getCountByMonth(prisma.petani, -1),
    ]);

    const jumlahPetaniBertambah = petaniBulanIni - petaniBulanSebelumnya;

    // Mengambil data produk (berdasarkan PackingLog IoT)
    const [packingLogTotal, packingLogBulanIni, packingLogBulanSebelumnya] = await Promise.all([
      prisma.packingLog.count(),
      getCountByMonth(prisma.packingLog),
      getCountByMonth(prisma.packingLog, -1),
    ]);

    const peningkatanJumlahProduk = packingLogBulanIni - packingLogBulanSebelumnya;

    // Mengambil data produk terjual (berdasarkan Transaksi)
    const [totalTerjualAgg, terjualBulanIni, terjualBulanSebelumnya] = await Promise.all([
      prisma.transaksi.aggregate({ _sum: { jumlah: true } }),
      getProdukByMonth(0),
      getProdukByMonth(-1),
    ]);

    const totalTerjual = totalTerjualAgg._sum.jumlah || 0;
    const peningkatanPenjualan = terjualBulanIni - terjualBulanSebelumnya;

    // Mengambil data cocoblog
    const [cocoblogTotal, cocoblogBulanIni, cocoblogBulanSebelumnya] = await Promise.all([
      prisma.cocoblog.aggregate({ _count: { id: true } }),
      getCountByMonth(prisma.cocoblog),
      getCountByMonth(prisma.cocoblog, -1),
    ]);

    const statusCounts = await prisma.produksi.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    // Get real packing logs from IoT
    const totalPackingLogs = await prisma.packingLog.count();

    const jumlahDataDiayak = statusCounts.find((s) => s.status === STATUS.DIAYAK)?._count.status || 0;
    const jumlahDataDioven = statusCounts.find((s) => s.status === STATUS.DIOVEN)?._count.status || 0;
    const jumlahDataDisortir = statusCounts.find((s) => s.status === STATUS.DISORTIR)?._count.status || 0;

    // Use IoT data for "Dikemas" count
    // REVERTED: Now using manual count again as per request
    const jumlahDataDikemas = statusCounts.find((s) => s.status === STATUS.DIKEMAS)?._count.status || 0;

    // New variable for IoT packing count
    const jumlahKemasMesin = totalPackingLogs;

    const jumlahDataSelesai = statusCounts.find((s) => s.status === STATUS.SELESAI)?._count.status || 0;

    const totalData = jumlahDataDiayak + jumlahDataDioven + jumlahDataDisortir + jumlahDataDikemas + jumlahDataSelesai;
    const persentaseSelesai = totalData > 0 ? ((jumlahDataSelesai / totalData) * 100).toFixed(2) : 0;

    // Menyusun data
    const atas = [
      {
        nama: "petani",
        nilai: jumlahPetaniBertambah,
        value: petaniTotal._count.id,
      },
      {
        nama: "produk",
        nilai: peningkatanPenjualan,
        value: totalTerjual,
      },

      {
        nama: "cocoblog",
        nilai: cocoblogBulanIni,
        value: cocoblogTotal._count.id,
      },
    ];


    const kanan = [
      {
        nama: "diayak",
        nilai: jumlahDataDiayak,
      },
      {
        nama: "dioven",
        nilai: jumlahDataDioven,
      },
      {
        nama: "disortir",
        nilai: jumlahDataDisortir,
      },
      {
        nama: "dikemas",
        nilai: jumlahDataDikemas,
      },
      {
        nama: "selesai",
        nilai: jumlahDataSelesai,
      },
      {
        nama: "presentase",
        nilai: persentaseSelesai,
      },
      {
        nama: "kemas_mesin",
        nilai: jumlahKemasMesin,
      },
    ];

    // Get All Farmers for Performance Matrix
    const allPetani = await prisma.petani.findMany({
      select: { id: true, nama: true }
    });

    // Get IoT Packing Stats Per Farmer (including Unassigned)
    const iotStatsPerPetani = await prisma.packingLog.groupBy({
      by: ['petaniId'],
      _count: { id: true },
      _sum: { weight: true },
    });

    // Get Production Progress Per Farmer
    const productionStatsPerPetani = await prisma.produksi.groupBy({
      by: ['id_petani', 'status'],
      _count: { status: true },
    });

    const petaniPerformance = allPetani.map(p => {
      const iot = iotStatsPerPetani.find(s => s.petaniId === p.id);
      const prod = productionStatsPerPetani.filter(s => s.id_petani === p.id);

      return {
        id: p.id,
        nama: p.nama,
        iotWeight: iot?._sum.weight || 0,
        iotPackCount: iot?._count.id || 0,
        stages: {
          diayak: prod.find(s => s.status === STATUS.DIAYAK)?._count.status || 0,
          dioven: prod.find(s => s.status === STATUS.DIOVEN)?._count.status || 0,
          disortir: prod.find(s => s.status === STATUS.DISORTIR)?._count.status || 0,
          dikemas: prod.find(s => s.status === STATUS.DIKEMAS)?._count.status || 0,
          selesai: prod.find(s => s.status === STATUS.SELESAI)?._count.status || 0,
        }
      };
    });

    // Handle Unassigned Logs
    const unassignedIot = iotStatsPerPetani.find(s => s.petaniId === null);
    if (unassignedIot) {
      petaniPerformance.push({
        id: 0,
        nama: "Unassigned/Antrian IoT",
        iotWeight: unassignedIot._sum.weight || 0,
        iotPackCount: unassignedIot._count.id || 0,
        stages: { diayak: 0, dioven: 0, disortir: 0, dikemas: 0, selesai: 0 }
      });
    }

    // Top 5 based on IoT Weight
    const topFarmers = [...petaniPerformance]
      .filter(p => p.id !== 0) // Exclude unassigned from leaderboard
      .sort((a, b) => b.iotWeight - a.iotWeight)
      .slice(0, 5)
      .map((p, index) => ({
        rank: index + 1,
        nama: p.nama,
        totalWeight: p.iotWeight,
        totalPacking: p.iotPackCount,
      }));

    // Recent IoT Activities
    const recentActivities = await prisma.packingLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        petani: { select: { nama: true } },
        device: { select: { name: true } }
      }
    });

    // Get Overall Weight Stats
    const weightAgg = await prisma.packingLog.aggregate({
      _sum: { weight: true },
      _avg: { weight: true },
    });

    const totalWeightStats = {
      totalWeight: weightAgg._sum.weight || 0,
      averageWeight: weightAgg._avg.weight || 0,
    };

    return res.status(200).json({
      success: true,
      message: "OK",
      err: null,
      data: { atas, kanan, topFarmers, totalWeightStats, petaniPerformance, recentActivities },
    });
  } catch (err) {
    next(err);
    return res.status(400).json({
      success: false,
      message: "Bad Request!",
      err: err.message,
      data: null,
    });
  }
};

module.exports = {
  dashboardAtas,
};
