const router = require('express').Router();
const {
  getLatestLoadcellReading,
  getPackingLogs,
  ingestData,
  deletePackingLog,
  resetDeviceLogs
} = require('../controllers/iot.controller.js');

router.get('/loadcell/:deviceId', getLatestLoadcellReading);
router.get('/loadcell/latest/:deviceId', getLatestLoadcellReading);
router.get('/loadcell/logs/:deviceId', getPackingLogs);
router.post('/loadcell/ingest', ingestData);

// Log Management Routes
router.delete('/logs/:id', deletePackingLog);
router.delete('/logs/reset/:deviceId', resetDeviceLogs);

module.exports = router;
