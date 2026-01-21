const prisma = require("../libs/prisma");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const createAdmin = async (req, res, next) => {
  try {
    const { username, password, authCode } = req.body;

    if (authCode !== process.env.ADMIN_REGISTRATION_CODE) {
      console.log("Registration denied. Received:", authCode, "Expected:", process.env.ADMIN_REGISTRATION_CODE);
      return res.status(403).json({
        success: false,
        message: "Forbidden!",
        err: "Invalid Registration Code!",
        data: null,
      });
    }

    const admin = await prisma.admin.findUnique({
      where: {
        username,
      },
    });

    if (admin) {
      return res.status(409).json({
        success: false,
        message: "Bad Request!",
        err: "Username already exists!",
        data: null,
      });
    }

    const encryptedPassword = await bcrypt.hash(password, 10);

    const newAdmin = await prisma.admin.create({
      data: {
        username,
        password: encryptedPassword,
      },
    });
    delete newAdmin.password;

    return res.status(201).json({
      success: true,
      message: "Created Successfully!",
      data: newAdmin,
    });
  } catch (error) {
    next(error);
  }
};

const authenticate = async (req, res) => {
  return res.status(200).json({
    status: true,
    message: "OK",
    err: null,
    data: { user: req.user },
  });
};

const loginAdmin = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    const admin = await prisma.admin.findUnique({
      where: {
        username: username,
      },
    });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found',
        data: null,
      });
    }

    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Wrong id or Password',
        data: null,
      });
    }

    const payload = {
      id: admin.id,
      username: admin.username,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET || "YOUR_SECRET_KEY", {
      expiresIn: '1d',
    });

    return res.status(200).json({
      success: true,
      message: 'Login success',
      token: token,
    });
  } catch (error) {
    next(error);
  }
};

const dashboardAtas = async (req, res, next) => {
  try {
    // petani
    const petani = await prisma.petani.aggregate({
      _count: { id: true },
    });

    // produk
    const produk = await prisma.produk.aggregate({
      _count: { jumlah: true },
    });

    console.log(petani, produk);


    // artikel

    return res.status(200).json({
      success: true,
      message: "OK",
      err: null,
      data: null,
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

const getProfile = async (req, res, next) => {
  try {
    const admin = await prisma.admin.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        username: true,
        nama: true,
        profile_pic: true,
        createdAt: true,
      }
    });

    return res.status(200).json({
      success: true,
      message: "Profile retrieved!",
      data: admin,
    });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { username, nama } = req.body;

    const updatedAdmin = await prisma.admin.update({
      where: { id: req.user.id },
      data: {
        username,
        nama,
      },
      select: {
        id: true,
        username: true,
        nama: true,
        profile_pic: true,
      }
    });

    return res.status(200).json({
      success: true,
      message: "Profile updated!",
      data: updatedAdmin,
    });
  } catch (error) {
    next(error);
  }
};

const imagekit = require("../libs/imagekit");
const path = require("path");

const updateProfilePhoto = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Photo is required" });
    }

    const strFile = req.file.buffer.toString("base64");
    const { url } = await imagekit.upload({
      fileName: `profile_${req.user.id}_${Date.now()}${path.extname(req.file.originalname)}`,
      file: strFile,
      folder: "/profiles"
    });

    const updatedAdmin = await prisma.admin.update({
      where: { id: req.user.id },
      data: { profile_pic: url },
      select: { profile_pic: true }
    });

    return res.status(200).json({
      success: true,
      message: "Photo updated!",
      data: updatedAdmin,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createAdmin,
  authenticate,
  loginAdmin,
  dashboardAtas,
  getProfile,
  updateProfile,
  updateProfilePhoto,
};
