const prisma = require("../libs/prisma");
const { getPagination } = require("../helpers/pagination");
const { petaniSchema } = require("../validations/validation");
const { handleErrorResponse } = require("../middlewares/handleErrorResponse");
const { formatNomorHP } = require("../helpers/helper");

const handleValidation = (data) => {
  const { value, error } = petaniSchema.validate(data);
  return { value, error };
};

const toNumber = (value) => {
  return Number(value);
};

const createPetani = async (req, res, next) => {
  try {
    const { value, error } = handleValidation(req.body);
    const id_admin = req.user.id;

    if (error) {
      return handleErrorResponse(res, error);
    }

    const petani = await prisma.petani.create({
      data: {
        id_admin,
        ...value,
        no_hp: formatNomorHP(value.no_hp),
      },
    });

    res.status(201).json({
      success: true,
      message: "Petani berhasil ditambahkan",
      err: null,
      data: { petani },
    });
  } catch (err) {
    next(err);
    handleErrorResponse(res, err);
  }
};

const getAllPetani = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const skip = (toNumber(page) - 1) * toNumber(limit);
    const take = toNumber(limit);

    const [getPetani, { _count }] = await Promise.all([
      prisma.petani.findMany({
        where: search ? {
          nama: {
            contains: search,
            mode: "insensitive",
          },
        } : {},
        skip,
        take,
        orderBy: {
          nama: 'asc',
        },
      }),
      prisma.petani.aggregate({
        _count: { id: true },
        where: search ? {
          nama: {
            contains: search,
            mode: "insensitive",
          },
        } : {},
      }),
    ]);

    const pagination = getPagination(req, res, _count.id, page, limit, search);
    return res.status(200).json({
      success: true,
      message: "OK",
      err: null,
      data: { pagination, petani: getPetani },
    });
  } catch (err) {
    next(err);
    handleErrorResponse(res, err);
  }
};

const getPetaniById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const petani = await prisma.petani.findUnique({
      where: { id: toNumber(id) },
      include: {
        produksi: true,
      },
    });

    if (!petani) {
      return res.status(404).json({
        success: false,
        message: "Petani tidak ditemukan",
        err: null,
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Petani ditemukan",
      err: null,
      data: petani,
    });
  } catch (err) {
    next(err);
    handleErrorResponse(res, err);
  }
};

const updatePetani = async (req, res, next) => {
  try {
    const { value, error } = handleValidation(req.body);
    const id_admin = req.user.id;
    const { id } = req.params;

    if (error) {
      return handleErrorResponse(res, error);
    }

    const check = await prisma.petani.findUnique({
      where: { id: toNumber(id) },
    });

    if (!check) {
      return res.status(404).json({
        success: false,
        message: "Petani tidak ditemukan",
        err: null,
        data: null,
      });
    }

    const petani = await prisma.petani.update({
      where: { id: toNumber(id) },
      data: {
        id_admin,
        ...value,
        no_hp: formatNomorHP(value.no_hp),
      },
    });

    return res.status(200).json({
      success: true,
      message: "Petani berhasil diperbarui",
      err: null,
      data: petani,
    });
  } catch (err) {
    next(err);
    handleErrorResponse(res, err);
  }
};

const deletePetani = async (req, res, next) => {
  try {
    const { id } = req.params;

    const check = await prisma.petani.findUnique({
      where: { id: toNumber(id) },
    });

    if (!check) {
      return res.status(404).json({
        success: false,
        message: "Petani tidak ditemukan",
        err: null,
        data: null,
      });
    }

    await prisma.petani.delete({ where: { id: toNumber(id) }, });

    return res.status(200).json({
      success: true,
      message: "Petani berhasil dihapus",
      err: null,
      data: null,
    });
  } catch (err) {
    next(err);
    handleErrorResponse(res, err);
  }
};

module.exports = {
  createPetani,
  getAllPetani,
  updatePetani,
  deletePetani,
  getPetaniById,
};