const {dashboardAtas,} = require('../controllers/dashboard.controller');
const router = require('express').Router();
const verifyToken = require('../libs/verifyToken');

router.get('/atas', verifyToken, dashboardAtas);

module.exports = router;