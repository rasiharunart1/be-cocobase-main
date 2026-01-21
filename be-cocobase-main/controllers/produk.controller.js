const prisma = require("../libs/prisma");
const imagekit = require("../libs/imagekit");
const path = require("path");
const { getPagination } = require("../helpers/pagination");
const { produkSchema } = require("../validations/validation");
const { handleErrorResponse } = require("../middlewares/handleErrorResponse");
const uploadFiles = require("../libs/uploadImage");

const createProduk = async (req, res, next) => {
  try {
    const { value, error } = produkSchema.validate(req.body);
    const id_admin = req.user.id;

    if (error) {
      return handleErrorResponse(res, error);
    }

    const { linkGambar, ...dataProduk } = value;

    const produk = await prisma.produk.create({
      data: {
        id_admin,
        ...dataProduk,
      },
    });

    const gambar = await uploadFiles(
      req.file,
      produk.id,
      "Produk",
      produk.judul
    );

    res.status(201).json({
      success: true,
      message: "Produk berhasil ditambahkan",
      data: { produk, gambar },
    });
  } catch (err) {
    next(err);
    handleErrorResponse(res, err);
  }
};

const getAllProduk = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [getProduk, { _count }] = await Promise.all([
      prisma.produk.findMany({
        where: search
          ? { nama: { contains: search, mode: "insensitive" } }
          : {},
        include: { gambar: { select: { url: true } }, transaksi: {select: {jumlah: true}} },
        skip,
        take,
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.produk.aggregate({
        _count: { id: true },
        where: search
          ? { nama: { contains: search, mode: "insensitive" } }
          : {},
      }),
    ]);

    const formattedProduk = getProduk.map((produk) => {
      const { transaksi, ...rest } = produk;
      return {
        ...rest,
        jumlah: transaksi.reduce((acc, transaksi) => acc + transaksi.jumlah, 0 ),
        gambar: produk.gambar[0]?.url || null,
      };
    });

    const pagination = getPagination(req, res, _count.id, page, limit);

    res.status(200).json({
      success: true,
      message: "OK",
      data: { pagination, produk: formattedProduk },
    });
  } catch (err) {
    next(err);
    handleErrorResponse(res, err);
  }
};

const getProdukById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const produk = await prisma.produk.findUnique({
      where: { id: parseInt(id) },
      include: { gambar: { select: { url: true } } },
    });

    if (!produk) {
      return res.status(404).json({
        success: false,
        message: "Produksi tidak ditemukan",
        data: null,
      });
    }

    res.status(200).json({
      success: true,
      message: "Produksi ditemukan",
      data: {
        ...produk,
        gambar: produk.gambar[0]?.url || null,
      },
    });
  } catch (err) {
    next(err);
    handleErrorResponse(res, err);
  }
};

const updateProduk = async (req, res, next) => {
  try {
    const { value, error } = produkSchema.validate(req.body);
    const { id } = req.params;
    const id_admin = req.user.id;

    if (error) {
      return handleErrorResponse(res, error);
    }

    const check = await prisma.produk.findUnique({
      where: { id: parseInt(id) },
    });

    if (!check) {
      return res.status(404).json({
        success: false,
        message: "Produk tidak ditemukan",
        data: null,
      });
    }

    const { linkGambar, ...dataProduk } = value;

    if (req.file) {
      await prisma.gambar.deleteMany({ where: { ProdukId: parseInt(id) } });
      const gambar = await uploadFiles(
        req.file,
        check.id,
        "Produk",
        check.judul
      );
      const produk = await prisma.produk.update({
        where: { id: parseInt(id) },
        data: {
          id_admin,
          ...dataProduk,
        },
      });
      res.status(200).json({
        success: true,
        message: "Update produk berhasil",
        data: { produk, gambar },
      });
    } else {
      if (!linkGambar) {
        return res.status(404).json({
          success: false,
          message: "Link gambar tidak ditemukan",
          data: null,
        });
      }
      const produk = await prisma.produk.update({
        where: { id: parseInt(id) },
        data: {
          id_admin,
          ...dataProduk,
        },
      });
      res.status(200).json({
        success: true,
        message: "Update produk berhasil",
        data: produk,
      });
    }
  } catch (err) {
    next(err);
    handleErrorResponse(res, err);
  }
};

const deleteProduk = async (req, res, next) => {
  try {
    const { id } = req.params;

    const check = await prisma.produk.findUnique({
      where: { id: parseInt(id) },
    });

    if (!check) {
      return res.status(404).json({
        success: false,
        message: "Produk tidak ditemukan",
        data: null,
      });
    }

    await prisma.gambar.deleteMany({ where: { ProdukId: parseInt(id) } });
    await prisma.produk.delete({ where: { id: parseInt(id) } });

    res.status(200).json({
      success: true,
      message: "Produk berhasil dihapus",
      data: null,
    });
  } catch (err) {
    next(err);
    handleErrorResponse(res, err);
  }
};

module.exports = {
  createProduk,
  getAllProduk,
  getProdukById,
  updateProduk,
  deleteProduk,
};
