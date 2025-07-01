// Rotas para gerenciar o histórico de status de leads
const express = require("express");
const router = express.Router();
const protegerRota = require("../middlewares/authMiddleware");
const {
  getLeadStatusHistory,
  getStatusChangeStats,
  getBulkStatusHistory,
  getRecentStatusChanges
} = require("../controllers/leadStatusHistoryController");

// Buscar histórico de status de um lead específico
router.get("/:leadId/status-history", protegerRota, getLeadStatusHistory);

// Buscar estatísticas de mudanças de status
router.get("/status-history/stats", protegerRota, getStatusChangeStats);

// Buscar histórico de múltiplos leads
router.post("/status-history/bulk", protegerRota, getBulkStatusHistory);

// Buscar mudanças de status recentes
router.get("/status-history/recent", protegerRota, getRecentStatusChanges);

module.exports = router;

