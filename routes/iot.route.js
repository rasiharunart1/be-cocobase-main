const router = require('express').Router();
const {
  getLatestLoadcellReading,
  getPackingLogs,
  ingestData,
  deletePackingLog,
  resetDeviceLogs,
  verifyPacking
} = require('../controllers-backup/iot.controller.js');

router.get('/loadcell/:deviceId', getLatestLoadcellReading);
router.get('/loadcell/latest/:deviceId', getLatestLoadcellReading);
router.get('/loadcell/logs/:deviceId', getPackingLogs);
router.post('/loadcell/ingest', ingestData);
router.post('/loadcell/pack', require('../controllers-backup/iot.controller.js').createPackingLog);
router.post('/logs/verify/:id', verifyPacking);
router.post('/commands/:deviceId', require('../controllers-backup/iot.controller.js').sendCommand);

// Log Management Routes
router.delete('/logs/:id', deletePackingLog);
router.delete('/logs/reset/:deviceId', resetDeviceLogs);

module.exports = router;
