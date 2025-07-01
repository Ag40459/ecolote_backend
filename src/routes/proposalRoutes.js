const express = require("express");
const proposalController = require("../controllers/proposalController");

const router = express.Router();

router.post("/generate-proposal/:leadId", proposalController.generateProposal);

module.exports = router;

