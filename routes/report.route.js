const router = require('express').Router();
const {
    generateReport
} = require('../controllers-backup/report.controller');

router.get('/generate', generateReport);
// Also binding to root just in case
router.get('/', generateReport);

module.exports = router;
