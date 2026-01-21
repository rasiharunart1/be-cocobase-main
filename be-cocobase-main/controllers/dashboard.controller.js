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

    const jumlahDataDiayak = statusCounts.find((s) => s.status === STATUS.DIAYAK)?._count.status || 0;
    const jumlahDataDioven = statusCounts.find((s) => s.status === STATUS.DIOVEN)?._count.status || 0;
    const jumlahDataDisortir = statusCounts.find((s) => s.status === STATUS.DISORTIR)?._count.status || 0;
    const jumlahDataDikemas = statusCounts.find((s) => s.status === STATUS.DIKEMAS)?._count.status || 0;
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
        nilai: peningkatanJumlahProduk,
        value: packingLogTotal,
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
    ];

    return res.status(200).json({
      success: true,
      message: "OK",
      err: null,
      data: { atas, kanan },
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

