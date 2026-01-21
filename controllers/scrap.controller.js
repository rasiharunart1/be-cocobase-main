const prisma = require("../libs/prisma");
const { getPagination } = require("../helpers/pagination");
const { scrapSchema } = require("../validations/validation");
const { handleErrorResponse } = require("../middlewares/handleErrorResponse");

const handleValidation = (data) => {
  const { value, error } = scrapSchema.validate(data);
  return { value, error };
};

const toNumber = (value) => {
  return Number(value);
};

const createScrap = async (req, res, next) => {
  try {
    const { value, error } = handleValidation(req.body);
    const id_admin = req.user.id;

    if (error) {
      return handleErrorResponse(res, error);
    }
    
    const existingScrap = await prisma.scrap.findFirst({
      where: {
        minggu_ke: value.minggu_ke,
        bulan: value.bulan,
        tahun: value.tahun
      }
    });

    if (existingScrap) {
      return res.status(400).json({
        success: false,
        message: `Data dengan minggu ke-${value.minggu_ke}, bulan ke-${value.bulan}, dan tahun ${value.tahun} sudah ada`,
        err: null,
        data: null
      });
    }

    const scrap = await prisma.scrap.create({
      data: {
        id_admin,
        ...value,
      },
    });

    res.status(201).json({
      success: true,
      message: "Scrap berhasil ditambahkan",
      err: null,
      data: { scrap },
    });
  } catch (err) {
    next(err);
    handleErrorResponse(res, err);
  }
};

const getAllScrap = async (req, res, next) => {
  try {
    const getScrap = await prisma.scrap.findMany({
      orderBy: [
        { tahun: 'asc' },
        { bulan: 'asc' },
        { minggu_ke: 'asc' }
      ]
    });

    return res.status(200).json({
      success: true,
      message: "OK",
      err: null,
      data: { scrap: getScrap },
    });
  } catch (err) {
    next(err);
    handleErrorResponse(res, err);
  }
};

const updateScrap = async (req, res, next) => {
  try {
    const { value, error } = handleValidation(req.body);
    const id_admin = req.user.id;
    const { id } = req.params;

    if (error) {
      return handleErrorResponse(res, error);
    }

    const existingScrap = await prisma.scrap.findFirst({
      where: {
        minggu_ke: value.minggu_ke,
        bulan: value.bulan,
        tahun: value.tahun
      }
    });

    if (existingScrap) {
      return res.status(400).json({
        success: false,
        message: `Data dengan minggu ke-${value.minggu_ke}, bulan ke-${value.bulan}, dan tahun ${value.tahun} sudah ada`,
        err: null,
        data: null
      });
    }

    const check = await prisma.scrap.findUnique({
      where: { id: toNumber(id) },
    });

    if (!check) {
      return res.status(404).json({
        success: false,
        message: "Scrap tidak ditemukan",
        err: null,
        data: null,
      });
    }

    const scrap = await prisma.scrap.update({
      where: { id: toNumber(id) },
      data: {
        id_admin,
        ...value,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Scrap berhasil diperbarui",
      err: null,
      data: scrap,
    });
  } catch (err) {
    next(err);
    handleErrorResponse(res, err);
  }
};

const deleteScrap = async (req, res, next) => {
  try {
    const { id } = req.params;

    const check = await prisma.scrap.findUnique({
      where: { id: toNumber(id) },
    });

    if (!check) {
      return res.status(404).json({
        success: false,
        message: "Scrap tidak ditemukan",
        err: null,
        data: null,
      });
    }

    await prisma.scrap.delete({ where: { id: toNumber(id) }, });

    return res.status(200).json({
      success: true,
      message: "Scrap berhasil dihapus",
      err: null,
      data: null,
    });
  } catch (err) {
    next(err);
    handleErrorResponse(res, err);
  }
};

module.exports = {
  createScrap,
  getAllScrap,
  updateScrap,
  deleteScrap,
};