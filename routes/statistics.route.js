const router = require('express').Router();
const { getPetaniStats, getLeaderboard, getAllPetaniStats } = require('../controllers/statistics.controller');
const verifyToken = require('../middlewares/verifyToken');

router.get('/petani/:petaniId', verifyToken, getPetaniStats);
router.get('/leaderboard', verifyToken, getLeaderboard);
router.get('/all', verifyToken, getAllPetaniStats);

module.exports = router;
