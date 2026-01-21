const prisma = require("../libs/prisma");
const { getPagination } = require("../helpers/pagination");
const {
  produksiSchema,
  produksiSchemaUpdate,
  produksiSchemaUpdateStatus,
} = require("../validations/validation");
const { handleErrorResponse } = require("../middlewares/handleErrorResponse");

const checkExistence = async (id, model) => {
  return await prisma[model].findUnique({ where: { id: Number(id) } });
};

const createProduksi = async (req, res, next) => {
  try {
    const { value, error } = produksiSchema.validate(req.body);
    if (error) return handleErrorResponse(res, error);

    const id_admin = req.user.id;
    const { id_petani, produk, jumlah } = value;

    const petaniExists = await checkExistence(id_petani, 'petani');
    if (!petaniExists) {
      return res.status(404).json({
        success: false,
        message: "Petani tidak ditemukan",
        err: null,
        data: null,
      });
    }

    const produksi = await prisma.produksi.create({
      data: { id_admin, id_petani, produk, jumlah },
    });

    res.status(201).json({
      success: true,
      message: "Produksi berhasil ditambahkan",
      err: null,
      data: { produksi },
    });
  } catch (err) {
    next(err);
    return handleErrorResponse(res, err);
  }
};

const getAllProduksi = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;

    const whereConditions = {
      ...(search && {
        produk: { contains: search, mode: "insensitive" },
      }),
      ...(status && {
        status: { equals: status },
      }),
    };

    const [getProduksi, { _count }] = await Promise.all([
      prisma.produksi.findMany({
        where: whereConditions,
        include: {
          petani: { select: { nama: true } },
        },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.produksi.aggregate({
        _count: { id: true },
        where: whereConditions,
      }),
    ]);

    const pagination = getPagination(req, res, _count.id, page, limit, search, status);

    return res.status(200).json({
      success: true,
      message: "OK",
      err: null,
      data: {
        pagination,
        produksi: getProduksi.map((produksi) => ({
          ...produksi,
          petani: produksi.petani.nama,
        })),
      },
    });
  } catch (err) {
    next(err);
    return handleErrorResponse(res, err);
  }
};

const getProduksiById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const produksi = await prisma.produksi.findUnique({
      where: { id: Number(id) },
      include: { petani: { select: { nama: true } } },
    });

    if (!produksi) {
      return res.status(404).json({
        success: false,
        message: "Produksi tidak ditemukan",
        err: null,
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Produksi ditemukan",
      err: null,
      data: {
        id: produksi.id,
        id_petani: produksi.id_petani,
        petani: produksi.petani.nama,
        produk: produksi.produk,
        jumlah: produksi.jumlah,
        status: produksi.status,
        createdAt: produksi.createdAt,
        updatedAt: produksi.updatedAt,
      },
    });
  } catch (err) {
    next(err);
    return handleErrorResponse(res, err);
  }
};

const updateProduksi = async (req, res, next) => {
  try {
    const { value, error } = produksiSchemaUpdate.validate(req.body);
    if (error) return handleErrorResponse(res, error);

    const { id } = req.params;
    const id_admin = req.user.id;

    const check = await checkExistence(id, 'produksi');
    if (!check) {
      return res.status(404).json({
        success: false,
        message: "Produksi tidak ditemukan",
        err: null,
        data: null,
      });
    }

    const produksi = await prisma.produksi.update({
      where: { id: Number(id) },
      data: { id_admin, ...value },
    });

    return res.status(200).json({
      success: true,
      message: "Produksi berhasil diperbarui",
      err: null,
      data: produksi,
    });
  } catch (err) {
    next(err);
    return handleErrorResponse(res, err);
  }
};

const updateProduksiStatus = async (req, res, next) => {
  try {
    const { value, error } = produksiSchemaUpdateStatus.validate(req.body);
    if (error) return handleErrorResponse(res, error);

    const { id } = req.params;
    const id_admin = req.user.id;

    const check = await checkExistence(id, 'produksi');
    if (!check) {
      return res.status(404).json({
        success: false,
        message: "Produksi tidak ditemukan",
        err: null,
        data: null,
      });
    }

    const produksi = await prisma.produksi.update({
      where: { id: Number(id) },
      data: { id_admin, status: value.status },
    });

    return res.status(200).json({
      success: true,
      message: "Update status produksi berhasil",
      err: null,
      data: produksi,
    });
  } catch (err) {
    next(err);
    return handleErrorResponse(res, err);
  }
};

const deleteProduksi = async (req, res, next) => {
  try {
    const { id } = req.params;

    const check = await checkExistence(id, 'produksi');
    if (!check) {
      return res.status(404).json({
        success: false,
        message: "Produksi tidak ditemukan",
        err: null,
        data: null,
      });
    }

    await prisma.produksi.delete({ where: { id: Number(id) } });
    return res.status(200).json({
      success: true,
      message: "Produksi berhasil dihapus",
      err: null,
      data: null,
    });
  } catch (err) {
    next(err);
    return handleErrorResponse(res, err);
  }
};

module.exports = {
  createProduksi,
  getAllProduksi,
  updateProduksi,
  deleteProduksi,
  getProduksiById,
  updateProduksiStatus,
};