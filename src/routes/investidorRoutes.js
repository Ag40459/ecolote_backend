const express = require("express");
const investidorController = require("../controllers/investidorController");

const router = express.Router();

// Rota para criar um novo investidor
router.post("/investidores", investidorController.criarInvestidor);

// Outras rotas para Investidores (GET, PUT, DELETE) podem ser adicionadas aqui no futuro

module.exports = router;

