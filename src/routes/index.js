const express = require("express");
const pessoaFisicaRoutes = require("./pessoaFisicaRoutes");
const pessoaJuridicaRoutes = require("./pessoaJuridicaRoutes");
const investidorRoutes = require("./investidorRoutes");
const adminRoutes = require("./adminRoutes"); // Descomentado para incluir as rotas de admin

const router = express.Router();

// Rotas para formulários públicos
router.use(pessoaFisicaRoutes);
router.use(pessoaJuridicaRoutes);
router.use(investidorRoutes);

// Rotas para administração
router.use("/admin", adminRoutes); // Adiciona o prefixo /admin para as rotas de admin

module.exports = router;

