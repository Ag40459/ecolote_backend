const express = require("express");
const investidorController = require("../controllers/investidorController");

const router = express.Router();

router.post("/investidores", investidorController.criarInvestidor);

module.exports = router;