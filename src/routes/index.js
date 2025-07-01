const express = require("express");
const pessoaFisicaRoutes = require("./pessoaFisicaRoutes");
const pessoaJuridicaRoutes = require("./pessoaJuridicaRoutes");
const investidorRoutes = require("./investidorRoutes");
const adminRoutes = require("./adminRoutes"); 
const verificacaoRoutes = require("./verificacaoRoutes"); 
const visitCounterRoutes = require("./visitCounterRoutes");
const leadRoutes = require("./leadRoutes");
const proposalRoutes = require("./proposalRoutes");
const reactivationRoutes = require("./reactivationRoutes");


const router = express.Router();

router.use(pessoaFisicaRoutes);
router.use(pessoaJuridicaRoutes);
router.use(investidorRoutes);
router.use("/leads", reactivationRoutes);
router.use("/leads",leadRoutes);

router.use("/admin", adminRoutes);
router.use("/verificacao", verificacaoRoutes);
router.use("/visits", visitCounterRoutes);
router.use("/proposals", proposalRoutes);

module.exports = router;