const { 
  processInactiveLeads, 
  getLeadsAwaitingReactivation, 
  reactivateLead, 
  discardLeadForInactivity, 
  extendReactivationDeadline 
} = require("../services/reactivationService");

/**
 * Processa leads inativos (job manual ou automático)
 * POST /api/leads/process-inactive
 */
const processInactive = async (req, res) => {
  try {
    const result = await processInactiveLeads();
    
    return res.status(200).json({
      message: "Processamento de leads inativos concluído.",
      processedCount: result.processedCount,
      updatedCount: result.updatedCount,
      leads: result.leads
    });
  } catch (error) {
    console.error("Error in processInactive:", error);
    return res.status(500).json({ error: error.message || "Erro interno do servidor." });
  }
};

/**
 * Busca leads aguardando reativação para o vendedor logado
 * GET /api/leads/awaiting-reactivation
 */
const getAwaitingReactivation = async (req, res) => {
  try {
    const sellerId = req.user?.id;

    if (!sellerId) {
      return res.status(401).json({ error: "Usuário não autenticado." });
    }

    const leads = await getLeadsAwaitingReactivation(sellerId);
    
    return res.status(200).json(leads);
  } catch (error) {
    console.error("Error in getAwaitingReactivation:", error);
    return res.status(500).json({ error: error.message || "Erro interno do servidor." });
  }
};

/**
 * Reativa um lead específico
 * PUT /api/leads/:leadId/reactivate
 */
const reactivateLeadById = async (req, res) => {
  try {
    const { leadId } = req.params;
    const { newStatus, notes, follow_up_date, follow_up_notes } = req.body;
    const sellerId = req.user?.id;
    const io = req.app.get("io");

    if (!sellerId) {
      return res.status(401).json({ error: "Usuário não autenticado." });
    }

    if (!newStatus) {
      return res.status(400).json({ error: "Novo status é obrigatório." });
    }

    const reactivationData = {
      notes,
      follow_up_date,
      follow_up_notes
    };

    const reactivatedLead = await reactivateLead(leadId, newStatus, sellerId, reactivationData);

    if (reactivatedLead) {
      io.emit("leadUpdate", reactivatedLead);
      return res.status(200).json(reactivatedLead);
    } else {
      return res.status(404).json({ error: "Lead não encontrado ou não pôde ser reativado." });
    }
  } catch (error) {
    console.error("Error in reactivateLeadById:", error);
    if (error.message.includes("não está aguardando reativação") || 
        error.message.includes("não está atribuído")) {
      return res.status(409).json({ error: error.message });
    }
    return res.status(500).json({ error: error.message || "Erro interno do servidor." });
  }
};

/**
 * Descarta um lead por inatividade
 * PUT /api/leads/:leadId/discard
 */
const discardLead = async (req, res) => {
  try {
    const { leadId } = req.params;
    const { reason } = req.body;
    const sellerId = req.user?.id;
    const io = req.app.get("io");

    if (!sellerId) {
      return res.status(401).json({ error: "Usuário não autenticado." });
    }

    const discardedLead = await discardLeadForInactivity(leadId, sellerId, reason);

    if (discardedLead) {
      io.emit("leadUpdate", discardedLead);
      return res.status(200).json(discardedLead);
    } else {
      return res.status(404).json({ error: "Lead não encontrado ou não pôde ser descartado." });
    }
  } catch (error) {
    console.error("Error in discardLead:", error);
    return res.status(500).json({ error: error.message || "Erro interno do servidor." });
  }
};

/**
 * Estende o prazo de reativação de um lead
 * PUT /api/leads/:leadId/extend-deadline
 */
const extendDeadline = async (req, res) => {
  try {
    const { leadId } = req.params;
    const { extensionDays, notes } = req.body;
    const sellerId = req.user?.id;
    const io = req.app.get("io");

    if (!sellerId) {
      return res.status(401).json({ error: "Usuário não autenticado." });
    }

    if (!extensionDays || ![10, 20, 30].includes(Number(extensionDays))) {
      return res.status(400).json({ error: "Extensão deve ser de 10, 20 ou 30 dias." });
    }

    if (!notes || notes.trim().length === 0) {
      return res.status(400).json({ error: "Notas são obrigatórias para estender o prazo." });
    }

    const extendedLead = await extendReactivationDeadline(leadId, sellerId, Number(extensionDays), notes);

    if (extendedLead) {
      io.emit("leadUpdate", extendedLead);
      return res.status(200).json(extendedLead);
    } else {
      return res.status(404).json({ error: "Lead não encontrado ou não pôde ter prazo estendido." });
    }
  } catch (error) {
    console.error("Error in extendDeadline:", error);
    return res.status(500).json({ error: error.message || "Erro interno do servidor." });
  }
};

module.exports = {
  processInactive,
  getAwaitingReactivation,
  reactivateLeadById,
  discardLead,
  extendDeadline
};

