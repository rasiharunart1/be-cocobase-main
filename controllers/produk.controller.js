const prisma = require('../libs/prisma');
const { imagekit } = require('../libs/imagekit');

const createProduk = async (req, res, next) => {
    try {
        const { nama, deskripsi, harga, jumlah, unit, link } = req.body;

        const produk = await prisma.produk.create({
            data: {
                nama,
                deskripsi,
                harga: Number(harga),
                jumlah: Number(jumlah),
                unit: unit || 'KG',
                link: link || '',
                id_admin: req.user.id
            }
        });

        res.status(201).json({
            success: true,
            message: 'Produk created successfully',
            data: produk
        });
    } catch (err) {
        next(err);
    }
};

const getProduk = async (req, res, next) => {
    try {
        const { search, page = 1, limit = 10 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);

        const where = {};
        if (search) {
            where.nama = {
                contains: search,
                mode: 'insensitive'
            };
        }

        const [produk, total] = await prisma.$transaction([
            prisma.produk.findMany({
                where,
                skip,
                take: Number(limit),
                orderBy: { createdAt: 'desc' },
                include: { gambar: true }
            }),
            prisma.produk.count({ where })
        ]);

        res.status(200).json({
            success: true,
            message: 'Produk retrieved successfully',
            data: produk,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit))
            }
        });
    } catch (err) {
        next(err);
    }
};

const getProdukById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const produk = await prisma.produk.findUnique({
            where: { id: Number(id) },
            include: { gambar: true }
        });

        if (!produk) {
            return res.status(404).json({
                success: false,
                message: 'Produk not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Produk retrieved successfully',
            data: produk
        });
    } catch (err) {
        next(err);
    }
};

const updateProduk = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { nama, deskripsi, harga, jumlah, unit, link } = req.body;

        const check = await prisma.produk.findUnique({ where: { id: Number(id) } });
        if (!check) return res.status(404).json({ success: false, message: 'Produk not found' });

        const produk = await prisma.produk.update({
            where: { id: Number(id) },
            data: {
                nama,
                deskripsi,
                harga: Number(harga),
                jumlah: Number(jumlah),
                unit,
                link
            }
        });

        res.status(200).json({
            success: true,
            message: 'Produk updated successfully',
            data: produk
        });
    } catch (err) {
        next(err);
    }
};

const deleteProduk = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Check if there are images
        const images = await prisma.gambar.findMany({ where: { ProdukId: Number(id) } });

        // Delete images from ImageKit
        for (const img of images) {
            await imagekit.deleteFile(img.idImagekit);
        }

        // Delete from DB (Cascade delete via schema relations usually, but manually deleting images first is safer for ImageKit sync)
        await prisma.gambar.deleteMany({ where: { ProdukId: Number(id) } });

        await prisma.produk.delete({
            where: { id: Number(id) }
        });

        res.status(200).json({
            success: true,
            message: 'Produk deleted successfully'
        });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    createProduk,
    getProduk,
    getProdukById,
    updateProduk,
    deleteProduk
};
