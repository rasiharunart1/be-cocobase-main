const prisma = require('../libs/prisma');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const login = async (req, res, next) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username and password are required',
            });
        }

        const admin = await prisma.admin.findUnique({
            where: { username }
        });

        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found',
            });
        }

        const isMatch = await bcrypt.compare(password, admin.password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials',
            });
        }

        const token = jwt.sign({ id: admin.id, role: 'admin' }, process.env.JWT_SECRET || 'secret', {
            expiresIn: '7d',
        });

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                token,
                user: {
                    id: admin.id,
                    username: admin.username,
                    nama: admin.nama,
                    role: 'admin'
                }
            },
        });
    } catch (err) {
        next(err);
    }
};

const profile = async (req, res, next) => {
    try {
        const adminId = req.user.id;
        const admin = await prisma.admin.findUnique({
            where: { id: adminId },
            select: {
                id: true,
                username: true,
                nama: true,
                profile_pic: true,
                createdAt: true
            }
        });

        if (!admin) {
            return res.status(404).json({ success: false, message: 'Admin not found' });
        }

        res.status(200).json({
            success: true,
            message: 'Profile retrieved',
            data: admin
        });
    } catch (err) {
        next(err);
    }
};

// Simplified register for internal/seeding use if needed
const register = async (req, res, next) => {
    try {
        const { username, password, nama } = req.body;
        if (!username || !password) return res.status(400).json({ success: false, message: 'Missing fields' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const admin = await prisma.admin.create({
            data: {
                username,
                password: hashedPassword,
                nama
            }
        });

        res.status(201).json({ success: true, message: 'Admin created', data: { id: admin.id, username: admin.username } });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    login,
    profile,
    register
};
