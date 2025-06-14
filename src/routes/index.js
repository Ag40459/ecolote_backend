const express = require("express");
console.log("DEBUG: Arquivo src/routes/index.js está sendo executado.");
const pessoaFisicaRoutes = require("./pessoaFisicaRoutes");
const pessoaJuridicaRoutes = require("./pessoaJuridicaRoutes");
const investidorRoutes = require("./investidorRoutes");
const adminRoutes = require("./adminRoutes"); 
const verificacaoRoutes = require("./verificacaoRoutes"); 
const visitCounterRoutes = require('./visitCounterRoutes');


const router = express.Router();

router.use(pessoaFisicaRoutes);
router.use(pessoaJuridicaRoutes);
router.use(investidorRoutes);
router.use("/admin", adminRoutes);
router.use('/verificacao', verificacaoRoutes);
router.use('/api/visits', visitCounterRoutes);

module.exports = router;

