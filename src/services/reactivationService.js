const supabase = require("../config/supabaseClient");

const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000001';

async function markLeadsForReactivation(leadIds, reactivationDays = 30) {
  if (!leadIds || leadIds.length === 0) {
    return { updatedCount: 0 };
  }

  try {
    const reactivationDueDate = new Date();
    reactivationDueDate.setDate(reactivationDueDate.getDate() + reactivationDays);

    const { data, error } = await supabase
      .from("leads")
      .update({
        status: "Aguardando Reativação",
        last_status_update_at: new Date().toISOString(),
        reactivation_due_date: reactivationDueDate.toISOString().split('T')[0],
        updated_at: new Date().toISOString(),
        last_changed_by_user_id: SYSTEM_USER_ID
      })
      .in("id", leadIds)
      .select();

    if (error) {
      console.error("Erro ao marcar leads para reativação:", error);
      throw error;
    }

    return { updatedCount: data ? data.length : 0, updatedLeads: data };
  } catch (error) {
    console.error("Erro no markLeadsForReactivation:", error);
    throw error;
  }
}

async function reactivateLead(leadId, newStatus, sellerId, reactivationData = {}) {
  try {
    const { data: currentLead, error: fetchError } = await supabase
      .from("leads")
      .select("id, status, assigned_to_user_id")
      .eq("id", leadId)
      .single();

    if (fetchError) {
      throw new Error("Lead não encontrado.");
    }

    if (currentLead.status !== "Aguardando Reativação") {
      throw new Error("Lead não está aguardando reativação.");
    }

    if (currentLead.assigned_to_user_id !== sellerId) {
      throw new Error("Lead não está atribuído a este vendedor.");
    }

    const updateData = {
      status: newStatus,
      last_status_update_at: new Date().toISOString(),
      reactivation_notes: reactivationData.notes || null,
      follow_up_date: reactivationData.follow_up_date || null,
      follow_up_notes: reactivationData.follow_up_notes || null,
      updated_at: new Date().toISOString(),
      last_changed_by_user_id: sellerId
    };

    if (newStatus === "Em Atendimento") {
      updateData.attended_by_user_id = sellerId;
      updateData.attended_at = new Date().toISOString();
      updateData.is_active_attendance = true;
    }

    const { data, error } = await supabase
      .from("leads")
      .update(updateData)
      .eq("id", leadId)
      .select();

    if (error) {
      throw error;
    }

    return data ? data[0] : null;
  } catch (error) {
    console.error("Erro ao reativar lead:", error);
    throw error;
  }
}

async function discardLeadForInactivity(leadId, sellerId, reason = "Inatividade") {
  try {
    const discardStatus = reason === "Sem Interesse" ? "Descartado - Sem Interesse" : "Descartado - Inatividade";

    const { data, error } = await supabase
      .from("leads")
      .update({
        status: discardStatus,
        discard_reason: reason,
        last_status_update_at: new Date().toISOString(),
        is_active_attendance: false,
        attended_by_user_id: null,
        attended_at: null,
        updated_at: new Date().toISOString(),
        last_changed_by_user_id: sellerId
      })
      .eq("id", leadId)
      .eq("status", "Aguardando Reativação")
      .eq("assigned_to_user_id", sellerId)
      .select();

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      throw new Error("Lead não encontrado ou não pode ser descartado.");
    }

    return data[0];
  } catch (error) {
    console.error("Erro ao descartar lead:", error);
    throw error;
  }
}

async function extendReactivationDeadline(leadId, sellerId, extensionDays, notes) {
  try {
    const newDueDate = new Date();
    newDueDate.setDate(newDueDate.getDate() + extensionDays);

    const { data, error } = await supabase
      .from("leads")
      .update({
        reactivation_due_date: newDueDate.toISOString().split('T')[0],
        reactivation_notes: notes,
        last_status_update_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_changed_by_user_id: sellerId
      })
      .eq("id", leadId)
      .eq("status", "Aguardando Reativação")
      .eq("assigned_to_user_id", sellerId)
      .select();

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      throw new Error("Lead não encontrado ou não pode ter prazo estendido.");
    }

    return data[0];
  } catch (error) {
    console.error("Erro ao estender prazo:", error);
    throw error;
  }
}

async function getLeadStatusHistory(leadId) {
  try {
    const { data, error } = await supabase
      .from("lead_status_history")
      .select(`
        *,
        leads:lead_id(name)
      `)
      .eq("lead_id", leadId)
      .order("changed_at", { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Erro ao buscar histórico de status:", error);
    throw error;
  }
}

async function getReactivationStats(sellerId = null, startDate = null, endDate = null) {
  try {
    let query = supabase
      .from("lead_status_history")
      .select("*")
      .eq("new_status", "Aguardando Reativação");

    if (sellerId) {
      query = query.eq("changed_by", sellerId);
    }

    if (startDate) {
      query = query.gte("changed_at", startDate.toISOString());
    }

    if (endDate) {
      query = query.lte("changed_at", endDate.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return {
      totalReactivations: data.length,
      reactivationsByDate: data.reduce((acc, record) => {
        const date = record.changed_at.split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {})
    };
  } catch (error) {
    console.error("Erro ao buscar estatísticas de reativação:", error);
    throw error;
  }
}

// --- REMOVIDA A LINHA PROBLEMÁTICA ---
// const {
//   identifyLeadsForReactivation,
//   processInactiveLeads,
//   getLeadsAwaitingReactivation
// } = require("./reactivationService");

// --- Se essas funções estiverem definidas neste arquivo, adicione-as aqui: ---
// async function identifyLeadsForReactivation(...) { ... }
// async function processInactiveLeads(...) { ... }
// async function getLeadsAwaitingReactivation(...) { ... }

module.exports = {
  // Se as funções acima estiverem definidas neste arquivo, adicione-as aqui:
  // identifyLeadsForReactivation,
  // processInactiveLeads,
  // getLeadsAwaitingReactivation,

  markLeadsForReactivation,
  reactivateLead,
  discardLeadForInactivity,
  extendReactivationDeadline,
  getLeadStatusHistory,
  getReactivationStats,
};
