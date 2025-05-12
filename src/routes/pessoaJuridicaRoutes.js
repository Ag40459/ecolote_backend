const express = require("express");
const pessoaJuridicaController = require("../controllers/pessoaJuridicaController");

const router = express.Router();

// Rota para criar uma nova pessoa jurídica
router.post("/pessoas-juridicas", pessoaJuridicaController.criarPessoaJuridica);

// Outras rotas para Pessoas Jurídicas (GET, PUT, DELETE) podem ser adicionadas aqui no futuro

module.exports = router;

