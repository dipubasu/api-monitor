const express = require("express");
const { handleGetAlerts } = require("../controllers/alertController");

const router = express.Router();

router.get("/alerts", handleGetAlerts);

module.exports = router;