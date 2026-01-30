const router = require('express').Router();
const { startSession, endSession, getActiveSession, getSessionHistory } = require('../controllers/session.controller');

router.post('/start', startSession);
router.post('/end/:deviceId', endSession);
router.get('/active/:deviceId', getActiveSession);
router.get('/history/:deviceId', getSessionHistory);

module.exports = router;
