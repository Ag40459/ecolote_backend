const supabase = require("../config/supabaseClient");

const getLeadStatusHistory = async (req, res) => {
  try {
    const { leadId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado." });
    }

    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("id, assigned_to_user_id")
      .eq("id", leadId)
      .single();

    if (leadError || !lead) {
      return res.status(404).json({ error: "Lead não encontrado." });
    }

    if (req.user.role !== 'admin' && lead.assigned_to_user_id !== userId) {
      return res.status(403).json({ error: "Acesso negado." });
    }

    const { data: history, error: historyError } = await supabase
      .from("lead_status_history")
      .select(`
        id,
        lead_id,
        old_status,
        new_status,
        changed_by,
        changed_at,
        notes
      `)
      .eq("lead_id", leadId)
      .order("changed_at", { ascending: false });

    if (historyError) {
      throw historyError;
    }

    return res.status(200).json(history || []);
  } catch (error) {
    console.error("Error in getLeadStatusHistory:", error);
    return res.status(500).json({ error: error.message || "Erro interno do servidor." });
  }
};

const getStatusChangeStats = async (req, res) => {
  try {
    const { startDate, endDate, sellerId } = req.query;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado." });
    }

    if (req.user.role !== 'admin' && sellerId && sellerId !== userId) {
      return res.status(403).json({ error: "Acesso negado." });
    }

    let query = supabase
      .from("lead_status_history")
      .select("new_status, changed_at, changed_by");

    if (startDate) {
      query = query.gte("changed_at", startDate);
    }
    if (endDate) {
      query = query.lte("changed_at", endDate);
    }

    if (sellerId) {
      query = query.eq("changed_by", sellerId);
    } else if (req.user.role !== 'admin') {
      query = query.eq("changed_by", userId);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    const stats = {
      totalChanges: data.length,
      changesByStatus: {},
      changesByDate: {},
      changesByUser: {}
    };

    data.forEach(record => {
      stats.changesByStatus[record.new_status] =
        (stats.changesByStatus[record.new_status] || 0) + 1;

      const date = record.changed_at.split('T')[0];
      stats.changesByDate[date] = (stats.changesByDate[date] || 0) + 1;

      const user = record.changed_by || 'Sistema';
      stats.changesByUser[user] = (stats.changesByUser[user] || 0) + 1;
    });

    return res.status(200).json(stats);
  } catch (error) {
    console.error("Error in getStatusChangeStats:", error);
    return res.status(500).json({ error: error.message || "Erro interno do servidor." });
  }
};

const getBulkStatusHistory = async (req, res) => {
  try {
    const { leadIds } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado." });
    }

    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return res.status(400).json({ error: "Lista de IDs de leads é obrigatória." });
    }

    let leadsQuery = supabase
      .from("leads")
      .select("id, assigned_to_user_id")
      .in("id", leadIds);

    if (req.user.role !== 'admin') {
      leadsQuery = leadsQuery.eq("assigned_to_user_id", userId);
    }

    const { data: leads, error: leadsError } = await leadsQuery;

    if (leadsError) {
      throw leadsError;
    }

    const accessibleLeadIds = leads.map(lead => lead.id);

    if (accessibleLeadIds.length === 0) {
      return res.status(403).json({ error: "Nenhum lead acessível encontrado." });
    }

    const { data: history, error: historyError } = await supabase
      .from("lead_status_history")
      .select(`
        id,
        lead_id,
        old_status,
        new_status,
        changed_by,
        changed_at,
        notes
      `)
      .in("lead_id", accessibleLeadIds)
      .order("changed_at", { ascending: false });

    if (historyError) {
      throw historyError;
    }

    const groupedHistory = history.reduce((acc, record) => {
      if (!acc[record.lead_id]) {
        acc[record.lead_id] = [];
      }
      acc[record.lead_id].push(record);
      return acc;
    }, {});

    return res.status(200).json(groupedHistory);
  } catch (error) {
    console.error("Error in getBulkStatusHistory:", error);
    return res.status(500).json({ error: error.message || "Erro interno do servidor." });
  }
};

const getRecentStatusChanges = async (req, res) => {
  try {
    const { hours = 24, limit = 50 } = req.query;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado." });
    }

    const hoursAgo = new Date();
    hoursAgo.setHours(hoursAgo.getHours() - parseInt(hours));

    let query = supabase
      .from("lead_status_history")
      .select(`
        id,
        lead_id,
        old_status,
        new_status,
        changed_by,
        changed_at,
        notes,
        leads:lead_id(name, assigned_to_user_id)
      `)
      .gte("changed_at", hoursAgo.toISOString())
      .order("changed_at", { ascending: false })
      .limit(parseInt(limit));

    if (req.user.role !== 'admin') {
      const { data: userLeads, error: userLeadsError } = await supabase
        .from("leads")
        .select("id")
        .eq("assigned_to_user_id", userId);

      if (userLeadsError) {
        throw userLeadsError;
      }

      const userLeadIds = userLeads.map(lead => lead.id);
      if (userLeadIds.length > 0) {
        query = query.in("lead_id", userLeadIds);
      } else {
        return res.status(200).json([]);
      }
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return res.status(200).json(data || []);
  } catch (error) {
    console.error("Error in getRecentStatusChanges:", error);
    return res.status(500).json({ error: error.message || "Erro interno do servidor." });
  }
};

module.exports = {
  getLeadStatusHistory,
  getStatusChangeStats,
  getBulkStatusHistory,
  getRecentStatusChanges
};
