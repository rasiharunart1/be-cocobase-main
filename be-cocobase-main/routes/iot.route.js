const router = require('express').Router();
const {
  getLatestLoadcellReading,
  getPackingLogs,
  ingestData,
} = require('../controllers/iot.controller.js');

router.get('/loadcell/:deviceId', getLatestLoadcellReading);
router.get('/loadcell/latest/:deviceId', getLatestLoadcellReading);
router.get('/loadcell/logs/:deviceId', getPackingLogs);
router.post('/loadcell/ingest', ingestData);

module.exports = router;
