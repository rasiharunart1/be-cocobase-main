const router = require('express').Router();

// router.use('/auth', require('./admin.route')); // Admin/Auth Controller Missing
router.use('/petani', require('./petani.route'));
// router.use('/produksi', require('./produksi.route')); // Produksi Controller Missing
router.use('/dashboard', require('./dashboard.route'));
// router.use('/cocoblog', require('./cocoblog.route')); // Cocoblog Controller Missing
// router.use('/scrap', require('./scrap.route')); // Scrap Controller Missing
router.use('/iot', require('./iot.route'));
router.use('/devices', require('./device.route'));
router.use('/reports', require('./report.route'));
// router.use('/session', require('./session.route')); // DEPRECATED: Session management removed
router.use('/statistics', require('./statistics.route'));
router.use('/auth/petani', require('./auth-petani.route'));

module.exports = router;
