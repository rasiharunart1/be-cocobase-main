const router = require('express').Router();
const { getPetaniStats, getLeaderboard, getAllPetaniStats } = require('../controllers-backup/statistics.controller');

router.get('/petani/:petaniId', getPetaniStats);
router.get('/leaderboard', getLeaderboard);
router.get('/all', getAllPetaniStats);

module.exports = router;
