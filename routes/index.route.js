const router = require('express').Router();

router.use('/auth', require('./admin.route'));
router.use('/petani', require('./petani.route'));
router.use('/produksi', require('./produksi.route'));
router.use('/produk', require('./produk.route'));
router.use('/dashboard', require('./dashboard.route'));
router.use('/cocoblog', require('./cocoblog.route'));
router.use('/pembeli', require('./pembeli.route'));
router.use('/transaksi', require('./transaksi.route'));
router.use('/scrap', require('./scrap.route'));
router.use('/iot', require('./iot.route'));
router.use('/devices', require('./device.route'));
router.use('/reports', require('./report.route'));

module.exports = router;
