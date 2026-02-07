const router = require('express').Router();
const { login, profile, register } = require('../controllers/admin.controller');
const verifyToken = require('../middlewares/verifyToken');

router.post('/login', login);
router.get('/profile', verifyToken, profile);
// router.post('/register', register); // Uncomment if you need to create an admin via API

module.exports = router;
