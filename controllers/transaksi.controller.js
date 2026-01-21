const prisma = require("../libs/prisma");
const { getPagination } = require("../helpers/pagination");
const { transaksiScheme } = require("../validations/validation");
const { handleErrorResponse } = require("../middlewares/handleErrorResponse");

const handleValidation = (data) => {
  const { value, error } = transaksiScheme.validate(data);
  return { value, error };
};

const toNumber = (value) => {
  return Number(value);
};

const createTransaksi = async (req, res, next) => {
  try {
    const { value, error } = handleValidation(req.body);
    const id_admin = req.user.id;

    if (error) {
      return handleErrorResponse(res, error);
    }

    const checkPembeli = await prisma.pembeli.findUnique({
      where: {
        id: value.id_pembeli,
      },
    });

    if (!checkPembeli) {
      return res.status(404).json({
        success: false,
        message: "Pembeli tidak ditemukan",
        err: null,
        data: null,
      });
    }

    const checkProduk = await prisma.produk.findUnique({
      where: {
        id: value.id_produk,
      },
    });

    if (!checkProduk) {
      return res.status(404).json({
        success: false,
        message: "Produk tidak ditemukan",
        err: null,
        data: null,
      });
    }

    const transaksi = await prisma.transaksi.create({
      data: {
        id_admin,
        ...value,
      },
    });

    res.status(201).json({
      success: true,
      message: "Transaksi berhasil ditambahkan",
      err: null,
      data: { transaksi },
    });
  } catch (err) {
    next(err);
    handleErrorResponse(res, err);
  }
};

const getAllTransaksi = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const skip = (toNumber(page) - 1) * toNumber(limit);
    const take = toNumber(limit);

    const [getTransaksi, { _count }] = await Promise.all([
      prisma.transaksi.findMany({
        where: search
          ? {
              nama: {
                contains: search,
                mode: "insensitive",
              },
            }
          : {},
        include: {
          pembeli: {
            select: {
              nama: true,
              alamat: true,
              no_telp: true,
            },
          },
          produk: {
            select: {
              nama: true,
            },
          },
        },
        skip,
        take,
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.transaksi.aggregate({
        _count: { id: true },
        where: search
          ? {
              nama: {
                contains: search,
                mode: "insensitive",
              },
            }
          : {},
      }),
    ]);

    const formattedTransaksi = getTransaksi.map((transaksi) => ({
      ...transaksi,
      total: transaksi.harga * transaksi.jumlah,
      createdAt: new Date(transaksi.createdAt).toLocaleString("id-ID", {
        timeZone: "Asia/Jakarta",
        dateStyle: "short",
        timeStyle: "short",
      }),
      updatedAt: new Date(transaksi.updatedAt).toLocaleString("id-ID", {
        timeZone: "Asia/Jakarta",
        dateStyle: "short",
        timeStyle: "short",
      }),
    }));

    const pagination = getPagination(req, res, _count.id, page, limit, search);
    return res.status(200).json({
      success: true,
      message: "OK",
      err: null,
      data: { pagination, transaksi: formattedTransaksi },
    });
  } catch (err) {
    next(err);
    handleErrorResponse(res, err);
  }
};

const getTransaksiById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const transaksi = await prisma.transaksi.findUnique({
      where: { id: toNumber(id) },
      include: {
        pembeli: {
          select: {
            nama: true,
            alamat: true,
            no_telp: true,
          },
        },
        produk: {
          select: {
            nama: true,
          },
        },
      },
    });

    if (!transaksi) {
      return res.status(404).json({
        success: false,
        message: "Transaksi tidak ditemukan",
        err: null,
        data: null,
      });
    }

    const formattedTransaksi = {
      ...transaksi,
      total: transaksi.harga * transaksi.jumlah,
    };

    return res.status(200).json({
      success: true,
      message: "Transaksi ditemukan",
      err: null,
      data: formattedTransaksi,
    });
  } catch (err) {
    next(err);
    handleErrorResponse(res, err);
  }
};

const updateTransaksi = async (req, res, next) => {
  try {
    const { value, error } = handleValidation(req.body);
    const id_admin = req.user.id;
    const { id } = req.params;

    if (error) {
      return handleErrorResponse(res, error);
    }

    const check = await prisma.transaksi.findUnique({
      where: { id: toNumber(id) },
    });

    if (!check) {
      return res.status(404).json({
        success: false,
        message: "Transaksi tidak ditemukan",
        err: null,
        data: null,
      });
    }

    const transaksi = await prisma.transaksi.update({
      where: { id: toNumber(id) },
      data: {
        id_admin,
        ...value,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Transaksi berhasil diperbarui",
      err: null,
      data: transaksi,
    });
  } catch (err) {
    next(err);
    handleErrorResponse(res, err);
  }
};

const deleteTransaksi = async (req, res, next) => {
  try {
    const { id } = req.params;

    const check = await prisma.transaksi.findUnique({
      where: { id: toNumber(id) },
    });

    if (!check) {
      return res.status(404).json({
        success: false,
        message: "Transaksi tidak ditemukan",
        err: null,
        data: null,
      });
    }

    await prisma.transaksi.delete({ where: { id: toNumber(id) } });

    return res.status(200).json({
      success: true,
      message: "Transaksi berhasil dihapus",
      err: null,
      data: null,
    });
  } catch (err) {
    next(err);
    handleErrorResponse(res, err);
  }
};

module.exports = {
  createTransaksi,
  getAllTransaksi,
  updateTransaksi,
  deleteTransaksi,
  getTransaksiById,
};
