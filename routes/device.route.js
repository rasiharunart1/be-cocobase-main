const router = require('express').Router();
const {
    getDevices,
    createDevice,
    updateDevice,
    deleteDevice
} = require('../controllers/device.controller');

router.get('/', getDevices);
router.post('/', createDevice);
router.put('/:id', updateDevice);
router.delete('/:id', deleteDevice);

module.exports = router;
