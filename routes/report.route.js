const router = require("express").Router();
const { generateReport } = require("../controllers/report.controller");

router.get("/generate", generateReport);

module.exports = router;
