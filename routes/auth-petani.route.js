const router = require('express').Router();
const { login, setPassword } = require('../controllers/auth-petani.controller');

router.post('/login', login);
router.post('/set-password', setPassword);

module.exports = router;
