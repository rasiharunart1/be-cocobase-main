const router = require('express').Router();
const {
    createScrap,
    getAllScrap,
    updateScrap,
    deleteScrap
} = require('../controllers/scrap.controller');
const verifyToken = require('../middlewares/verifyToken');

router.get('/', getAllScrap);
router.post('/', verifyToken, createScrap);
router.put('/:id', verifyToken, updateScrap);
router.delete('/:id', verifyToken, deleteScrap);

module.exports = router;
