const supabase = require("../config/supabaseClient");

async function countLeadsByTerm(term) {
  const { count, error } = await supabase
    .from("leads")
    .select("*", { count: "exact" })
    .eq("type", term)
    .eq("status", "Disponível");

  if (error) {
    console.error("Erro ao contar leads por termo:", error);
    return 0;
  }
  return count;
}

async function findDuplicateLead(lead) {
  const { data, error } = await supabase
    .from("leads")
    .select("id, place_id, name, formatted_address, latitude, longitude")
    .or(`name.ilike.%${lead.name.split(" ")[0]}%,formatted_address.ilike.%${lead.formatted_address.split(",")[0]}%`);

  if (error) {
    console.error("Erro ao buscar duplicatas:", error);
    return null;
  }

  const duplicate = data.find(existingLead => {
    const nameMatch = existingLead.name.toLowerCase() === lead.name.toLowerCase();
    const addressMatch = existingLead.formatted_address.toLowerCase() === lead.formatted_address.toLowerCase();

    const latDiff = Math.abs(existingLead.latitude - lead.latitude);
    const lonDiff = Math.abs(existingLead.longitude - lead.longitude);
    const coordinateMatch = latDiff < 0.0001 && lonDiff < 0.0001;

    return (nameMatch && addressMatch) || (nameMatch && coordinateMatch) || (addressMatch && coordinateMatch);
  });

  return duplicate;
}

const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000001';

async function processLeads(leads, userIdForCreation = SYSTEM_USER_ID) {
  let newLeadsCount = 0;
  let updatedLeadsCount = 0;
  let discardedLeadsCount = 0;

  for (const lead of leads) {
    const existingLead = await findDuplicateLead(lead);

    if (existingLead) {
      discardedLeadsCount++;
      console.log(`Lead descartado (duplicado): ${lead.name} - Place ID: ${lead.place_id}`);
    } else {
      const { error: insertError } = await supabase
        .from("leads")
        .insert({
          place_id: lead.place_id,
          name: lead.name,
          formatted_address: lead.formatted_address,
          city: lead.city,
          state: lead.state,
          neighborhood: lead.neighborhood,
          formatted_phone_number: lead.formatted_phone_number,
          latitude: lead.coordinates.lat,
          longitude: lead.coordinates.lng,
          image_urls: lead.image_urls,
          type: lead.type,
          collected_at: new Date().toISOString(),
          status: "Disponível",
          last_changed_by_user_id: userIdForCreation
        });

      if (insertError) {
        console.error("Erro ao inserir novo lead:", insertError);
      } else {
        newLeadsCount++;
      }
    }
  }

  return { newLeadsCount, updatedLeadsCount, discardedLeadsCount };
}

async function getAvailableLeads() {
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("status", "Disponível");

  if (error) {
    console.error("Erro ao buscar leads disponíveis:", error);
    throw error;
  }
  return data;
}

async function getLeadDetails(leadId) {
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("id", leadId);

  if (error) {
    console.error("Erro ao buscar detalhes do lead:", error);
    throw error;
  }
  return data ? data[0] : null;
}

async function updateLeadStatus(leadId, newStatus, userId, additionalData = {}) {
  try {
    const updateData = {
      status: newStatus,
      last_status_update_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_changed_by_user_id: userId,
      ...additionalData
    };

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
    console.error("Erro ao atualizar status do lead:", error);
    throw error;
  }
}

// Modificação aqui: adicionado newStatus como parâmetro
async function assignLeadToSeller(leadId, sellerId, adminId, newStatus = "Em Atendimento") {
  try {
    const updateData = {
      assigned_to_user_id: sellerId,
      assigned_at: new Date().toISOString(),
      status: newStatus, // Agora usa o parâmetro newStatus
      last_status_update_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_changed_by_user_id: adminId
    };

    const { data, error } = await supabase
      .from("leads")
      .update(updateData)
      .eq("id", leadId)
      .eq("status", "Disponível")
      .select();

    if (error) {
      throw error;
    }
    if (!data || data.length === 0) {
      throw new Error("Lead não está disponível para atribuição.");
    }

    return data[0];
  } catch (error) {
    console.error("Erro ao atribuir lead:", error);
    throw error;
  }
}

async function startLeadAttendance(leadId, userId) {
  try {
    const { data: currentLead, error: fetchError } = await supabase
      .from("leads")
      .select("id, status, is_active_attendance")
      .eq("id", leadId)
      .single();

    if (fetchError) {
      throw new Error("Lead não encontrado.");
    }

    if (currentLead.is_active_attendance) {
      throw new Error("Este lead já está sendo atendido por outro vendedor.");
    }

    const updateData = {
      status: "Em Atendimento",
      attended_by_user_id: userId,
      attended_at: new Date().toISOString(),
      is_active_attendance: true,
      last_status_update_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_changed_by_user_id: userId
    };

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
    console.error("Erro ao iniciar atendimento:", error);
    throw error;
  }
}

async function endLeadAttendance(leadId, userId, attendanceDetails) {
  try {
    const { data: currentLead, error: fetchError } = await supabase
      .from("leads")
      .select("id, status, is_active_attendance, attended_by_user_id, contact_attempts, contact_history")
      .eq("id", leadId)
      .single();

    if (fetchError) {
      throw new Error("Lead não encontrado.");
    }

    if (!currentLead.is_active_attendance || currentLead.attended_by_user_id !== userId) {
      throw new Error("Lead não está em atendimento por este vendedor.");
    }

    const newContactAttempts = (currentLead.contact_attempts || 0) + 1;
    const newContactHistory = currentLead.contact_history || [];
    newContactHistory.push({
      date: new Date().toISOString(),
      method: attendanceDetails.last_contact_method,
      successful: attendanceDetails.contact_successful,
      notes: attendanceDetails.last_contact_notes,
      seller_id: userId,
    });

    const updateData = {
      status: attendanceDetails.status,
      last_status_update_at: new Date().toISOString(),
      is_active_attendance: false,
      last_contact_at: new Date().toISOString(),
      last_contact_method: attendanceDetails.last_contact_method,
      last_contact_notes: attendanceDetails.last_contact_notes,
      contact_successful: attendanceDetails.contact_successful,
      contact_attempts: newContactAttempts,
      contact_history: newContactHistory,
      is_energy_from_other_source: attendanceDetails.is_energy_from_other_source,
      lead_interest_level: attendanceDetails.lead_interest_level,
      meeting_scheduled_at: attendanceDetails.meeting_scheduled_at || null,
      follow_up_date: attendanceDetails.follow_up_date || null,
      follow_up_notes: attendanceDetails.follow_up_notes || null,
      updated_at: new Date().toISOString(),
      attended_by_user_id: null,
      attended_at: null,
      last_changed_by_user_id: userId
    };

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
    console.error("Erro ao encerrar atendimento:", error);
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

async function getStatusChangeStats(startDate, endDate) {
  try {
    const { data, error } = await supabase
      .from("lead_status_history")
      .select("new_status, changed_at")
      .gte("changed_at", startDate.toISOString())
      .lte("changed_at", endDate.toISOString());

    if (error) {
      throw error;
    }

    const stats = data.reduce((acc, record) => {
      acc[record.new_status] = (acc[record.new_status] || 0) + 1;
      return acc;
    }, {});

    return stats;
  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error);
    throw error;
  }
}

module.exports = {
  processLeads,
  countLeadsByTerm,
  getAvailableLeads,
  updateLeadStatus,
  assignLeadToSeller,
  getLeadDetails,
  startLeadAttendance,
  endLeadAttendance,
  getLeadStatusHistory,
  getStatusChangeStats,
};
