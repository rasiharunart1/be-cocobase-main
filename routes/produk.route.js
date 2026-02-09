const router = require('express').Router();
const { createProduk, getProduk, getProdukById, updateProduk, deleteProduk } = require('../controllers/produk.controller');
const verifyToken = require('../middlewares/verifyToken');

router.post('/', verifyToken, createProduk);
router.get('/', verifyToken, getProduk);
router.get('/:id', verifyToken, getProdukById);
router.put('/:id', verifyToken, updateProduk);
router.delete('/:id', verifyToken, deleteProduk);

module.exports = router;
