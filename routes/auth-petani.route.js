const router = require('express').Router();
const { login, setPassword, updateProfile } = require('../controllers-backup/auth-petani.controller');
const verifyToken = require('../middlewares/verifyToken');

router.post('/login', login);
router.post('/set-password', setPassword);
router.put('/profile', verifyToken, updateProfile);

module.exports = router;
