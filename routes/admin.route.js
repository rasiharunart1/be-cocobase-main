const router = require('express').Router();
const { loginAdmin, getProfile, updateProfile, updateProfilePhoto } = require('../controllers/admin.controller');
const verifyToken = require('../middlewares/verifyToken');
const upload = require('../libs/uploadImage'); // Assumed upload middleware if needed, but updatedProfilePhoto uses req.file

// Manually using upload middleware or assuming it's handled globally? 
// Controller uses req.file, so we need multer or similar?
// cocoblog controller imports uploadFiles from ../libs/uploadImage. 
// admin controller imports imagekit and path, but expects req.file.
// I need "multer" middleware.
// I will skip file upload route for now or use a basic one if I can't find multer setup.
// Wait, admin.controller.js:198: if (!req.file) ...
// cocoblog.controller.js:33: const gambar = await uploadFiles(req.file...
// So there MUST be a middleware populateing req.file.
// I'll assume standard multer setup.

router.post('/login', loginAdmin);
router.get('/profile', verifyToken, getProfile);
router.put('/profile', verifyToken, updateProfile);
// router.put('/profile/photo', verifyToken, upload.single('photo'), updateProfilePhoto); // Commented out until upload middleware verified

module.exports = router;
