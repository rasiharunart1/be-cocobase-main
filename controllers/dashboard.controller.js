const prisma = require("../libs/prisma");

// Enum untuk status produksi
const STATUS = {
  DIAYAK: "DIAYAK",
  DIOVEN: "DIOVEN",
  DISORTIR: "DISORTIR",
  DIKEMAS: "DIKEMAS",
  SELESAI: "SELESAI",
};

// Fungsi utilitas untuk menghitung jumlah data berdasarkan bulan (dengan filter admin)
const getCountByMonth = async (model, monthOffset = 0, adminFilter = {}) => {
  const startDate = new Date(new Date().getFullYear(), new Date().getMonth() + monthOffset, 1);
  const endDate = new Date(new Date().getFullYear(), new Date().getMonth() + monthOffset + 1, 0);

  return await model.count({
    where: {
      ...adminFilter,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
  });
};

// Fungsi utilitas untuk menghitung jumlah produk terjual berdasarkan bulan (dengan filter admin)
const getProdukByMonth = async (monthOffset = 0, id_admin) => {
  const startDate = new Date(new Date().getFullYear(), new Date().getMonth() + monthOffset, 1);
  const endDate = new Date(new Date().getFullYear(), new Date().getMonth() + monthOffset + 1, 0);

  const transaksi = await prisma.transaksi.findMany({
    where: {
      id_admin,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  return transaksi.reduce((total, t) => total + t.jumlah, 0);
};

// Fungsi utama untuk mengambil data dashboard
const dashboardAtas = async (req, res, next) => {
  try {
    const id_admin = req.user.id;
    const adminFilter = { id_admin };

    // Mengambil data petani milik admin ini
    const [petaniTotal, petaniBulanIni, petaniBulanSebelumnya] = await Promise.all([
      prisma.petani.aggregate({ _count: { id: true }, where: adminFilter }),
      getCountByMonth(prisma.petani, 0, adminFilter),
      getCountByMonth(prisma.petani, -1, adminFilter),
    ]);

    const jumlahPetaniBertambah = petaniBulanIni - petaniBulanSebelumnya;

    // PackingLog tidak punya id_admin langsung, filter lewat petani milik admin ini
    const petaniIds = await prisma.petani.findMany({
      where: adminFilter,
      select: { id: true },
    }).then(list => list.map(p => p.id));

    const packingFilter = petaniIds.length > 0
      ? { petaniId: { in: petaniIds } }
      : { petaniId: -1 }; // Kosong jika belum ada petani

    const [packingLogBulanIni, packingLogBulanSebelumnya] = await Promise.all([
      getCountByMonth(prisma.packingLog, 0, packingFilter),
      getCountByMonth(prisma.packingLog, -1, packingFilter),
    ]);
    const packingLogTotal = await prisma.packingLog.count({ where: packingFilter });

    const peningkatanJumlahProduk = packingLogBulanIni - packingLogBulanSebelumnya;

    // Mengambil data produk terjual (berdasarkan Transaksi milik admin ini)
    const [totalTerjualAgg, terjualBulanIni, terjualBulanSebelumnya] = await Promise.all([
      prisma.transaksi.aggregate({ _sum: { jumlah: true }, where: adminFilter }),
      getProdukByMonth(0, id_admin),
      getProdukByMonth(-1, id_admin),
    ]);

    const totalTerjual = totalTerjualAgg._sum.jumlah || 0;
    const peningkatanPenjualan = terjualBulanIni - terjualBulanSebelumnya;

    // Mengambil data cocoblog milik admin ini
    const [cocoblogTotal, cocoblogBulanIni, cocoblogBulanSebelumnya] = await Promise.all([
      prisma.cocoblog.aggregate({ _count: { id: true }, where: adminFilter }),
      getCountByMonth(prisma.cocoblog, 0, adminFilter),
      getCountByMonth(prisma.cocoblog, -1, adminFilter),
    ]);

    // Status produksi milik admin ini
    const statusCounts = await prisma.produksi.groupBy({
      by: ['status'],
      where: adminFilter,
      _count: { status: true },
    });

    const totalPackingLogs = packingLogTotal;

    const jumlahDataDiayak = statusCounts.find((s) => s.status === STATUS.DIAYAK)?._count.status || 0;
    const jumlahDataDioven = statusCounts.find((s) => s.status === STATUS.DIOVEN)?._count.status || 0;
    const jumlahDataDisortir = statusCounts.find((s) => s.status === STATUS.DISORTIR)?._count.status || 0;
    const jumlahDataDikemas = statusCounts.find((s) => s.status === STATUS.DIKEMAS)?._count.status || 0;
    const jumlahKemasMesin = totalPackingLogs;
    const jumlahDataSelesai = statusCounts.find((s) => s.status === STATUS.SELESAI)?._count.status || 0;

    const totalData = jumlahDataDiayak + jumlahDataDioven + jumlahDataDisortir + jumlahDataDikemas + jumlahDataSelesai;
    const persentaseSelesai = totalData > 0 ? ((jumlahDataSelesai / totalData) * 100).toFixed(2) : 0;

    // Menyusun data atas
    const atas = [
      { nama: "petani", nilai: jumlahPetaniBertambah, value: petaniTotal._count.id },
      { nama: "produk",  nilai: peningkatanPenjualan,  value: totalTerjual },
      { nama: "cocoblog", nilai: cocoblogBulanIni, value: cocoblogTotal._count.id },
    ];

    const kanan = [
      { nama: "diayak",     nilai: jumlahDataDiayak },
      { nama: "dioven",     nilai: jumlahDataDioven },
      { nama: "disortir",   nilai: jumlahDataDisortir },
      { nama: "dikemas",    nilai: jumlahDataDikemas },
      { nama: "selesai",    nilai: jumlahDataSelesai },
      { nama: "presentase", nilai: persentaseSelesai },
      { nama: "kemas_mesin", nilai: jumlahKemasMesin },
    ];

    // Farmers Performance Matrix — hanya petani milik admin ini
    const allPetani = await prisma.petani.findMany({
      where: adminFilter,
      select: { id: true, nama: true },
    });

    // IoT stats hanya untuk petani milik admin ini
    const iotStatsPerPetani = petaniIds.length > 0
      ? await prisma.packingLog.groupBy({
          by: ['petaniId'],
          where: { petaniId: { in: petaniIds, not: null } },
          _count: { id: true },
          _sum: { weight: true },
        })
      : [];

    // Production stats hanya untuk petani milik admin ini
    const productionStatsPerPetani = petaniIds.length > 0
      ? await prisma.produksi.groupBy({
          by: ['id_petani', 'status'],
          where: { id_petani: { in: petaniIds } },
          _count: { status: true },
        })
      : [];

    const petaniPerformance = allPetani.map(p => {
      const iot = iotStatsPerPetani.find(s => s.petaniId === p.id);
      const prod = productionStatsPerPetani.filter(s => s.id_petani === p.id);

      return {
        id: p.id,
        nama: p.nama,
        iotWeight: iot?._sum.weight || 0,
        iotPackCount: iot?._count.id || 0,
        stages: {
          diayak:   prod.find(s => s.status === STATUS.DIAYAK)?._count.status || 0,
          dioven:   prod.find(s => s.status === STATUS.DIOVEN)?._count.status || 0,
          disortir: prod.find(s => s.status === STATUS.DISORTIR)?._count.status || 0,
          dikemas:  prod.find(s => s.status === STATUS.DIKEMAS)?._count.status || 0,
          selesai:  prod.find(s => s.status === STATUS.SELESAI)?._count.status || 0,
        }
      };
    });

    // Top 5 based on verified IoT Weight
    const topFarmers = [...petaniPerformance]
      .sort((a, b) => b.iotWeight - a.iotWeight)
      .slice(0, 5)
      .map((p, index) => ({
        rank: index + 1,
        nama: p.nama,
        totalWeight: p.iotWeight,
        totalPacking: p.iotPackCount,
      }));

    // Recent IoT Activities — hanya untuk petani milik admin ini
    const recentActivities = await prisma.packingLog.findMany({
      where: petaniIds.length > 0 ? { petaniId: { in: petaniIds } } : { petaniId: -1 },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        petani: { select: { nama: true } },
        device: { select: { name: true } },
      },
    });

    // Weight stats hanya untuk petani milik admin ini
    const weightAgg = petaniIds.length > 0
      ? await prisma.packingLog.aggregate({
          where: { petaniId: { in: petaniIds } },
          _sum: { weight: true },
          _avg: { weight: true },
        })
      : { _sum: { weight: 0 }, _avg: { weight: 0 } };

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
