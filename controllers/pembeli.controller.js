const prisma = require("../libs/prisma");
const { getPagination } = require("../helpers/pagination");
const { pembeliSchema } = require("../validations/validation");
const { handleErrorResponse } = require("../middlewares/handleErrorResponse");
const { formatNomorHP, formatTanggal } = require("../helpers/helper");

const handleValidation = (data) => {
  const { value, error } = pembeliSchema.validate(data);
  return { value, error };
};

const toNumber = (value) => {
  return Number(value);
};

const createPembeli = async (req, res, next) => {
  try {
    const { value, error } = handleValidation(req.body);
    const id_admin = req.user.id;

    if (error) {
      return handleErrorResponse(res, error);
    }

    const pembeli = await prisma.pembeli.create({
      data: {
        id_admin,
        ...value,
        no_telp: formatNomorHP(value.no_telp),
      },
    });

    res.status(201).json({
      success: true,
      message: "Pembeli berhasil ditambahkan",
      err: null,
      data: { pembeli },
    });
  } catch (err) {
    next(err);
    handleErrorResponse(res, err);
  }
};

const getAllPembeli = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const skip = (toNumber(page) - 1) * toNumber(limit);
    const take = toNumber(limit);

    const [getPembeli, { _count }] = await Promise.all([
      prisma.pembeli.findMany({
        where: search
          ? {
              nama: {
                contains: search,
                mode: "insensitive",
              },
            }
          : {},
        include: {
          transaksi: {
            select: {
              id: true,
              jumlah: true,
              harga: true,
              createdAt: true,
              updatedAt: true,
              produk: {
                select: {
                  nama: true,
                },
              },
            },
          },
        },
        skip,
        take,
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.pembeli.aggregate({
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

    const formattedPembeli = getPembeli.map((data) => ({
      ...data,
      createdAt: new Date(data.createdAt).toLocaleString("id-ID", {
        timeZone: "Asia/Jakarta",
        dateStyle: "short",
        timeStyle: "short",
      }),
      updatedAt: new Date(data.updatedAt).toLocaleString("id-ID", {
        timeZone: "Asia/Jakarta",
        dateStyle: "short",
        timeStyle: "short",
      }),
      transaksi: data.transaksi.map((trans) => ({
        ...trans,
        createdAt: new Date(trans.createdAt).toLocaleString("id-ID", {
          timeZone: "Asia/Jakarta",
          dateStyle: "short",
          timeStyle: "short",
        }),
        updatedAt: new Date(trans.updatedAt).toLocaleString("id-ID", {
          timeZone: "Asia/Jakarta",
          dateStyle: "short",
          timeStyle: "short",
        }),
        total: trans.jumlah * trans.harga,
        produk: trans.produk.nama,
      })),
    }));

    const pagination = getPagination(req, res, _count.id, page, limit, search);
    return res.status(200).json({
      success: true,
      message: "OK",
      err: null,
      data: { pagination, pembeli: formattedPembeli },
    });
  } catch (err) {
    next(err);
    handleErrorResponse(res, err);
  }
};

const getPembeliById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const pembeli = await prisma.pembeli.findUnique({
      where: { id: toNumber(id) },
      include: {
        transaksi: {
          include: {
            produk: true,
          },
        },
      },
    });

    if (!pembeli) {
      return res.status(404).json({
        success: false,
        message: "Pembeli tidak ditemukan",
        err: null,
        data: null,
      });
    }

    const formattedPembeli = {
      ...pembeli,
      createdAt: formatTanggal(pembeli.createdAt),
      updatedAt: formatTanggal(pembeli.updatedAt),
      transaksi: pembeli.transaksi.map((trans) => ({
        ...trans,
        createdAt: formatTanggal(trans.createdAt),
        updatedAt: formatTanggal(trans.updatedAt),
        total: trans.jumlah * trans.harga,
        produk: trans.produk.nama,
      })),
    };

    return res.status(200).json({
      success: true,
      message: "Pembeli ditemukan",
      err: null,
      data: formattedPembeli,
    });
  } catch (err) {
    next(err);
    handleErrorResponse(res, err);
  }
};

const updatePembeli = async (req, res, next) => {
  try {
    const { value, error } = handleValidation(req.body);
    const id_admin = req.user.id;
    const { id } = req.params;

    if (error) {
      return handleErrorResponse(res, error);
    }

    const check = await prisma.pembeli.findUnique({
      where: { id: toNumber(id) },
    });

    if (!check) {
      return res.status(404).json({
        success: false,
        message: "Pembeli tidak ditemukan",
        err: null,
        data: null,
      });
    }

    const pembeli = await prisma.pembeli.update({
      where: { id: toNumber(id) },
      data: {
        id_admin,
        ...value,
        no_telp: formatNomorHP(value.no_telp),
      },
    });

    return res.status(200).json({
      success: true,
      message: "Pembeli berhasil diperbarui",
      err: null,
      data: pembeli,
    });
  } catch (err) {
    next(err);
    handleErrorResponse(res, err);
  }
};

const deletePembeli = async (req, res, next) => {
  try {
    const { id } = req.params;

    const check = await prisma.pembeli.findUnique({
      where: { id: toNumber(id) },
    });

    if (!check) {
      return res.status(404).json({
        success: false,
        message: "Pembeli tidak ditemukan",
        err: null,
        data: null,
      });
    }

    await prisma.pembeli.delete({ where: { id: toNumber(id) } });

    return res.status(200).json({
      success: true,
      message: "Pembeli berhasil dihapus",
      err: null,
      data: null,
    });
  } catch (err) {
    next(err);
    handleErrorResponse(res, err);
  }
};

module.exports = {
  createPembeli,
  getAllPembeli,
  updatePembeli,
  deletePembeli,
  getPembeliById,
};
