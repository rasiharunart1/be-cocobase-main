const router = require('express').Router();
const {
    dashboardAtas
} = require('../controllers-backup/dashboard.controller');

router.get('/atas', dashboardAtas);

module.exports = router;
