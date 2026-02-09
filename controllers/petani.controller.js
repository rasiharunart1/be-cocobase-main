const prisma = require("../libs/prisma");
const bcrypt = require("bcrypt");
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
    // Safety check for user
    if (!req.user || !req.user.id) {
      throw new Error("User context missing. Is verifyToken middleware applied?");
    }
    const id_admin = req.user.id;

    if (error) {
      return handleErrorResponse(res, error);
    }

    let dataToCreate = {
      id_admin,
      ...value,
      no_hp: formatNomorHP(value.no_hp),
    };

    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      dataToCreate.password = await bcrypt.hash(req.body.password, salt);
    }

    const petani = await prisma.petani.create({
      data: dataToCreate,
    });

    res.status(201).json({
      success: true,
      message: "Petani berhasil ditambahkan",
      err: null,
      data: { petani },
    });
  } catch (err) {
    console.error("[CreatePetani] Error:", err);
    next(err);
    handleErrorResponse(res, err);
  }
};

const getAllPetani = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search } = req.query;

    // Safety check for pagination
    const pageNum = toNumber(page) || 1;
    const limitNum = toNumber(limit) || 10;

    const skip = (pageNum - 1) * limitNum;
    const take = limitNum;

    const [getPetani, { _count }] = await Promise.all([
      prisma.petani.findMany({
        where: search && search !== "undefined" ? {
          nama: {
            contains: search,
            mode: "insensitive",
            // Remove 'undefined' check inside query if prisma handles cleaner
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
        where: search && search !== "undefined" ? {
          nama: {
            contains: search,
            mode: "insensitive",
          },
        } : {},
      }),
    ]);

    const pagination = getPagination(req, res, _count.id, pageNum, limitNum, search);
    return res.status(200).json({
      success: true,
      message: "OK",
      err: null,
      data: { pagination, petani: getPetani },
    });
  } catch (err) {
    console.error("[GetAllPetani] Error:", err);
    // next(err); // Removed to prevent double response
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
    console.error("[GetPetaniById] Error:", err);
    next(err);
    handleErrorResponse(res, err);
  }
};

const updatePetani = async (req, res, next) => {
  try {
    // 1. Validate Input
    const { value, error } = handleValidation(req.body);
    if (error) {
      console.log("[UpdatePetani] Validation Error:", error.message);
      return handleErrorResponse(res, error);
    }

    // 2. Check User Context
    if (!req.user || !req.user.id) {
      throw new Error("User context missing in Update. Is verifyToken middleware applied?");
    }
    const id_admin = req.user.id;
    const { id } = req.params;

    // 3. Check Existence
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

    // 4. Update Logic (With Password Protection)
    // Extract password from value to prevent overwriting with empty string
    const { password, ...restValue } = value;

    let dataToUpdate = {
      id_admin,
      ...restValue,
      no_hp: formatNomorHP(value.no_hp),
    };

    // Only update password if a new one is provided
    if (req.body.password && req.body.password !== "") {
      const salt = await bcrypt.genSalt(10);
      dataToUpdate.password = await bcrypt.hash(req.body.password, salt);
    } else {
      // If password is blank/null, ensure we DO NOT update it.
      // dataToUpdate does not have 'password' key here.
    }

    console.log(`[UpdatePetani] Updating Petani ID ${id}. Fields:`, Object.keys(dataToUpdate));

    const petani = await prisma.petani.update({
      where: { id: toNumber(id) },
      data: dataToUpdate,
    });

    return res.status(200).json({
      success: true,
      message: "Petani berhasil diperbarui",
      err: null,
      data: petani,
    });
  } catch (err) {
    console.error("[UpdatePetani] Detailed Error:", err);
    next(err);
    // handleErrorResponse(res, err); // next(err) is enough usually, but keeping consistency
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
    console.error("[DeletePetani] Error:", err);
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