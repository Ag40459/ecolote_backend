const express = require("express");
console.log("DEBUG: Arquivo src/routes/adminRoutes.js está sendo executado.");
const adminController = require("../controllers/adminController");
const protegerRota = require("../middlewares/authMiddleware");

const router = express.Router();

// Rotas públicas de admin (ex: login, talvez registro inicial se não for interno)
router.post("/register", adminController.registrarAdmin);
router.post("/login", adminController.loginAdmin);
router.post("/request-password-reset", adminController.requestPasswordReset); // Nova rota

// Rotas protegidas de admin para visualização de dados
router.get("/data/pessoas-fisicas", protegerRota, adminController.buscarPessoasFisicas);
router.get("/data/pessoas-juridicas", protegerRota, adminController.buscarPessoasJuridicas);
router.get("/data/investidores", protegerRota, adminController.buscarInvestidores);

// Outras rotas de admin (protegidas) podem ser adicionadas aqui

module.exports = router;

