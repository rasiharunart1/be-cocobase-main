const router = require('express').Router();
const { dashboardAtas } = require('../controllers/dashboard.controller');
const verifyToken = require('../middlewares/verifyToken');

router.get('/', verifyToken, dashboardAtas);

module.exports = router;
