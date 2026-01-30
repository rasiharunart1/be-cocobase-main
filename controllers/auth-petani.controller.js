const prisma = require('../libs/prisma');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const login = async (req, res, next) => {
    try {
        const { nama, password } = req.body; // Using name for login as per request context, or maybe ID? usage of name/password seems standard

        if (!nama || !password) {
            return res.status(400).json({
                success: false,
                message: 'Name and password are required',
            });
        }

        const petani = await prisma.petani.findFirst({
            where: {
                nama: nama
            }
        });

        if (!petani) {
            return res.status(404).json({
                success: false,
                message: 'Farmer not found',
            });
        }

        // Since we just added password field, old users might not have one. 
        // We can allow first login to set password or check if password exists

        if (!petani.password) {
            // Should we allow login without password or force setup? 
            // For now, let's assume if no password, they can't login or need admin to set it.
            // But maybe for simplicity in this task, if no password set, we allow login with default or reject.
            // Let's go with: if no password, reject and ask admin to set it.
            return res.status(401).json({
                success: false,
                message: 'Account not set up for login. Please contact admin.',
            });
        }

        const isMatch = await bcrypt.compare(password, petani.password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials',
            });
        }

        const token = jwt.sign({ id: petani.id, role: 'petani' }, process.env.JWT_SECRET, {
            expiresIn: '7d',
        });

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                token,
                user: {
                    id: petani.id,
                    nama: petani.nama,
                    role: 'petani'
                }
            },
        });
    } catch (err) {
        next(err);
    }
};

// Endpoint for admin to set password for petani
const setPassword = async (req, res, next) => {
    try {
        const { petaniId, password } = req.body;

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await prisma.petani.update({
            where: { id: parseInt(petaniId) },
            data: { password: hashedPassword }
        });

        res.status(200).json({
            success: true,
            message: 'Password set successfully'
        });

    } catch (err) {
        next(err);
    }
}

module.exports = {
    login,
    setPassword
};
