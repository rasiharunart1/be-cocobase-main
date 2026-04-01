const router = require('express').Router();
const {
    createProduksi,
    getAllProduksi,
    updateProduksi,
    deleteProduksi,
    getProduksiById,
    updateProduksiStatus,
} = require('../controllers/produksi.controller');
const verifyToken = require('../middlewares/verifyToken');

router.get('/', verifyToken, getAllProduksi);
router.get('/:id', verifyToken, getProduksiById);
router.post('/', verifyToken, createProduksi);
router.put('/:id', verifyToken, updateProduksi);
router.put('/status/:id', verifyToken, updateProduksiStatus);
router.delete('/:id', verifyToken, deleteProduksi);

module.exports = router;
