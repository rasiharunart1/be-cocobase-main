const router = require('express').Router();

router.use('/auth', require('./admin.route'));
router.use('/petani', require('./petani.route'));
router.use('/produksi', require('./produksi.route'));
router.use('/dashboard', require('./dashboard.route'));
router.use('/cocoblog', require('./cocoblog.route'));
router.use('/scrap', require('./scrap.route')); // Scrap Route to be created
router.use('/iot', require('./iot.route'));
router.use('/devices', require('./device.route'));
router.use('/reports', require('./report.route'));
router.use('/produk', require('./produk.route')); // Added Produk Route
// router.use('/session', require('./session.route')); // DEPRECATED: Session management removed
router.use('/statistics', require('./statistics.route'));
router.use('/auth/petani', require('./auth-petani.route'));

module.exports = router;
