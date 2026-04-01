const router = require('express').Router();
const {
    getDevices,
    createDevice,
    updateDevice,
    deleteDevice,
} = require('../controllers/device.controller');
const verifyToken = require('../middlewares/verifyToken');

router.get('/', verifyToken, getDevices);
router.post('/', verifyToken, createDevice);
router.put('/:id', verifyToken, updateDevice);
router.delete('/:id', verifyToken, deleteDevice);

module.exports = router;
