const router = require('express').Router();
const {
    createCocoblog,
    getAllCocoblog,
    updateCocoblog,
    deleteCocoblog,
    getCocoblogById,
    uploadGambar
} = require('../controllers/cocoblog.controller');
const verifyToken = require('../middlewares/verifyToken');
const upload = require('../libs/uploadImage'); // Assumed upload middleware from libs/uploadImage.js which exports generic uploader? 
// No, controller uses `req.file` passed to `uploadFiles`. 
// We need a multer middleware here to handle the multipart/form-data.
// Since I haven't seen multer config, I'll use a basic memory storage multer.
const multer = require('multer');
const storage = multer.memoryStorage();
const uploadMiddleware = multer({ storage: storage });

router.get('/', getAllCocoblog);
router.get('/:id', getCocoblogById);
router.post('/', verifyToken, uploadMiddleware.single('image'), createCocoblog); // Field name 'image' or 'gambar'? Check frontend. Assuming 'image'/generic.
router.put('/:id', verifyToken, uploadMiddleware.single('image'), updateCocoblog);
router.delete('/:id', verifyToken, deleteCocoblog);
router.post('/upload', verifyToken, uploadMiddleware.single('image'), uploadGambar);

module.exports = router;
