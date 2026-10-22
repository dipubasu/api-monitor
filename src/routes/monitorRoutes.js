const express = require("express");
const { handleMonitor } = require("../controllers/monitorController");

const router = express.Router();

router.post("/monitor", handleMonitor);

module.exports = router;