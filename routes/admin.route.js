const {
    createAdmin,
    authenticate,
    loginAdmin,
    getProfile,
    updateProfile,
    updateProfilePhoto
} = require('../controllers/admin.controller');
const router = require('express').Router();
const verifyToken = require('../libs/verifyToken');
const { upload } = require('../libs/multer');

router.post('/register', createAdmin);
router.post('/login', loginAdmin);
router.get('/login', (req, res) => {
    res.status(405).json({
        success: false,
        message: 'Method Not Allowed. Please use POST request with email and password to login.',
        data: null
    });
});
router.get('/whoami', verifyToken, authenticate);

router.get('/profile', verifyToken, getProfile);
router.put('/profile', verifyToken, updateProfile);
router.put('/profile/photo', verifyToken, upload.single('photo'), updateProfilePhoto);

module.exports = router;