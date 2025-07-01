const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const protegerRota = require("../middlewares/authMiddleware");


// Rotas públicas de admin (ex: login, talvez registro inicial se não for interno)
router.post("/register", adminController.registrarAdmin);
router.post("/login", adminController.loginAdmin);
router.post("/request-password-reset", adminController.requestPasswordReset); 

// Rota protegida para pegar dados do admin logado (usada pelo AuthContext)
router.get("/me", protegerRota, adminController.getAdminProfile); 

// Rotas protegidas de admin para visualização de dados
router.get("/data/pessoas-fisicas", protegerRota, adminController.buscarPessoasFisicas);
router.get("/data/pessoas-juridicas", protegerRota, adminController.buscarPessoasJuridicas);
router.get("/data/investidores", protegerRota, adminController.buscarInvestidores);

// Outras rotas de admin (protegidas) podem ser adicionadas aqui

module.exports = router;

