const express = require('express');
const router = express.Router();
const verificacaoController = require('../services/verificacaoController');

// Rota para enviar código de verificação
router.post('/enviar-codigo', verificacaoController.enviarCodigoVerificacao);

// Rota para validar código de verificação
router.post('/validar-codigo', verificacaoController.validarCodigoVerificacao);

module.exports = router;