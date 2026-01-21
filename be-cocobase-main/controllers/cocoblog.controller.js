const prisma = require("../libs/prisma");
const { getPagination } = require("../helpers/pagination");
const { cocoblogSchema } = require("../validations/validation");
const { handleErrorResponse } = require("../middlewares/handleErrorResponse");
const uploadFiles = require("../libs/uploadImage");
const { convertMarkdownToHtml } = require("../helpers/markdown");

const toNumber = (value) => {
  return Number(value);
};

const createCocoblog = async (req, res, next) => {
  try {
    const { value, error } = cocoblogSchema.validate(req.body);
    const id_admin = req.user.id;

    if (error) {
      return handleErrorResponse(res, error);
    }

    const {linkGambar, ...dataProduk} = value;

    const isi = convertMarkdownToHtml(dataProduk.isi);

    const cocoblog = await prisma.cocoblog.create({
      data: {
        id_admin,
        ...dataProduk,
        isi: isi,
      },
    });

    const gambar = await uploadFiles(req.file, cocoblog.id, 'Cocoblog', cocoblog.judul);

    res.status(201).json({
      success: true,
      message: "Cocoblog berhasil ditambahkan",
      err: null,
      data: { cocoblog, gambar },
    });
  } catch (err) {
    next(err);
    return handleErrorResponse(res, err);
  }
};

const getAllCocoblog = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const skip = (toNumber(page) - 1) * toNumber(limit);
    const take = toNumber(limit);

    const whereClause = search
      ? {
          judul: {
            contains: search,
            mode: "insensitive",
          },
        }
      : {};

    const [getCocoblog, { _count }] = await Promise.all([
      prisma.cocoblog.findMany({
        where: whereClause,
        include: {
          gambar: { select: { url: true } },
        },
        skip,
        take,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.cocoblog.aggregate({ _count: { id: true }, where: whereClause }),
    ]);

    const formattedCocoblog = getCocoblog.map((cocoblog) => ({
      ...cocoblog,
      gambar: cocoblog.gambar[0]?.url || null,
    }));

    const pagination = getPagination(req, res, _count.id, page, limit);

    return res.status(200).json({
      success: true,
      message: "OK",
      err: null,
      data: { pagination, cocoblog: formattedCocoblog },
    });
  } catch (err) {
    next(err);
    return handleErrorResponse(res, err);
  }
};

const getCocoblogById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const cocoblog = await prisma.cocoblog.findUnique({
      where: { id: Number(id) },
      include: { gambar: { select: { url: true } } },
    });

    if (!cocoblog) {
      return res.status(404).json({
        success: false,
        message: "Cocoblog tidak ditemukan",
        err: null,
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Cocoblog ditemukan",
      err: null,
      data: {
        id: cocoblog.id,
        judul: cocoblog.judul,
        isi: cocoblog.isi,
        gambar: cocoblog.gambar[0]?.url || null,
        createdAt: cocoblog.createdAt,
        updatedAt: cocoblog.updatedAt,
      },
    });
  } catch (err) {
    next(err);
    return handleErrorResponse(res, err);
  }
};

const updateCocoblog = async (req, res, next) => {
  try {
    const { value, error } = cocoblogSchema.validate(req.body);
    const { id } = req.params;
    const id_admin = req.user.id;

    if (error) {
      return handleErrorResponse(res, error);
    }

    const check = await prisma.cocoblog.findUnique({
      where: { id: Number(id) },
    });
    if (!check) {
      return res.status(404).json({
        success: false,
        message: "Cocoblog tidak ditemukan",
        err: null,
        data: null,
      });
    }

    const {linkGambar, ...dataCocoblog} = value;
    const isi = convertMarkdownToHtml(dataCocoblog.isi);

    if (req.file) {
      await prisma.gambar.deleteMany({ where: { CocoblogId: Number(id) } });
      const gambar = await uploadFiles(req.file, check.id, 'Cocoblog', check.judul);
      const cocoblog = await prisma.cocoblog.update({
        where: { id: Number(id) },
        data: { id_admin, ...dataCocoblog, isi: isi },
      });
      res.status(200).json({
        success: true,
        message: "Update cocoblog berhasil",
        err: null,
        data: { cocoblog, gambar },
      });
  } else {
    if (!linkGambar) {
      return res.status(404).json({
        success: false,
        message: "Link gambar tidak ditemukan",
        data: null,
      });
    }

    const cocoblog = await prisma.cocoblog.update({
      where: { id: parseInt(id) },
      data: {
        id_admin,
        ...dataCocoblog,
      },
    });
    res.status(200).json({
      success: true,
      message: "Update produk berhasil",
      data: cocoblog,
    });
  }
  } catch (err) {
    next(err);
    return handleErrorResponse(res, err);
  }
};

const deleteCocoblog = async (req, res, next) => {
  try {
    const { id } = req.params;

    const check = await prisma.cocoblog.findUnique({
      where: { id: Number(id) },
    });
    if (!check) {
      return res.status(404).json({
        success: false,
        message: "Cocoblog tidak ditemukan",
        err: null,
        data: null,
      });
    }

    await prisma.gambar.deleteMany({ where: { CocoblogId: Number(id) } });
    await prisma.cocoblog.delete({ where: { id: Number(id) } });

    return res.status(200).json({
      success: true,
      message: "Cocoblog berhasil dihapus",
      err: null,
      data: null,
    });
  } catch (err) {
    next(err);
    return handleErrorResponse(res, err);
  }
};

const uploadGambar = async (req, res, next) => {
  try {

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "File gambar tidak ditemukan",
        err: null,
        data: null
      });
    }

    const gambar = await uploadFiles(req.file,);

    return res.status(200).json({
      success: true,
      message: "Gambar berhasil diupload",
      err: null,
      data: { gambar },
    });

  } catch (err) {
    next(err);
    return handleErrorResponse(res, err);
  }
};


module.exports = {
  createCocoblog,
  getAllCocoblog,
  updateCocoblog,
  deleteCocoblog,
  getCocoblogById,
  uploadGambar,
};
