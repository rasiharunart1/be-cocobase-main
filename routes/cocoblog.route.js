const router = require("express").Router();
const { upload } = require("../libs/multer");
const verifyToken = require("../libs/verifyToken");

const {
    createCocoblog,
    getAllCocoblog,
    updateCocoblog,
    deleteCocoblog,
    getCocoblogById,
    uploadGambar,
} = require("../controllers/cocoblog.controller");


router.get("/", getAllCocoblog);
router.get("/:id", getCocoblogById);
router.put("/:id", upload.single("image"), verifyToken, updateCocoblog);
router.delete("/:id", verifyToken, deleteCocoblog);
router.post("/", upload.single("image"), verifyToken, createCocoblog);
router.post("/upload-gambar", upload.single("image"), verifyToken, uploadGambar);

module.exports = router;
