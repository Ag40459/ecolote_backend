const express = require("express");
const router = express.Router();
const protegerRota = require("../middlewares/authMiddleware");
const {
  processInactive,
  getAwaitingReactivation,
  reactivateLeadById,
  discardLead,
  extendDeadline
} = require("../controllers/reactivationController");

// Processar leads inativos (job manual)
router.post("/process-inactive", protegerRota, processInactive);

// Buscar leads aguardando reativação do vendedor logado
router.get("/awaiting-reactivation", protegerRota, getAwaitingReactivation);

// Reativar um lead específico
router.put("/:leadId/reactivate", protegerRota, reactivateLeadById);

// Descartar um lead por inatividade
router.put("/:leadId/discard", protegerRota, discardLead);

// Estender prazo de reativação
router.put("/:leadId/extend-deadline", protegerRota, extendDeadline);

module.exports = router;

