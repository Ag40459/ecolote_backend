const express = require('express');
const router = express.Router();
const visitCounterController = require('../controllers/visitCounterController'); // Ajuste o caminho conforme a estrutura do seu projeto

// Rota para registrar uma visita única
router.post('/record', visitCounterController.recordVisit);

// Rota para obter o total de visitas únicas
router.get('/total', visitCounterController.getTotalVisits);

module.exports = router;
