const express = require("express");
const pessoaFisicaController = require("../controllers/pessoaFisicaController");

const router = express.Router();

// Rota para criar uma nova pessoa física
router.post("/pessoas-fisicas", pessoaFisicaController.criarPessoaFisica);

// Outras rotas para Pessoas Físicas (GET, PUT, DELETE) podem ser adicionadas aqui no futuro

module.exports = router;

