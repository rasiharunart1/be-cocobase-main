const router = require('express').Router();
const {
  getLatestLoadcellReading,
  getPackingLogs,
  ingestData,
  deletePackingLog,
  resetDeviceLogs,
  verifyPacking,
  sendCommand,
  createPackingLog,
} = require('../controllers/iot.controller.js');
const verifyToken = require('../middlewares/verifyToken');

// === ESP32 Endpoints (no JWT — authenticated by device token) ===
router.post('/loadcell/ingest', ingestData);
router.post('/loadcell/pack', createPackingLog);

// === Admin Endpoints (JWT required) ===
router.get('/loadcell/:deviceId', verifyToken, getLatestLoadcellReading);
router.get('/loadcell/latest/:deviceId', verifyToken, getLatestLoadcellReading);
router.get('/loadcell/logs/:deviceId', verifyToken, getPackingLogs);
router.post('/logs/verify/:id', verifyToken, verifyPacking);
router.post('/commands/:deviceId', verifyToken, sendCommand);

// Log Management (JWT required)
router.delete('/logs/:id', verifyToken, deletePackingLog);
router.delete('/logs/reset/:deviceId', verifyToken, resetDeviceLogs);

module.exports = router;
