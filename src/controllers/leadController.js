const { processLeads, countLeadsByTerm, getAvailableLeads, updateLeadStatus, assignLeadToSeller, getLeadDetails, startLeadAttendance, endLeadAttendance } = require("../services/leadService");
const { exec } = require("child_process");
const path = require("path");

const MIN_LEADS_THRESHOLD = 5;

const executePythonScript = (cidade, estado, termos) => {
  return new Promise((resolve, reject) => {
    const pythonScriptPath = path.join(__dirname, "../Utils/Leads/googlePlacesFetch.py");
    const command = `python ${pythonScriptPath} --cidade "${cidade}" --estado "${estado}" --termos "${termos.join(" ")}"`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        return reject(new Error("Erro ao executar o script Python."));
      }
      if (stderr) {
        console.error(`stderr: ${stderr}`);
      }

      try {
        const collectedLeads = JSON.parse(stdout);
        resolve(collectedLeads);
      } catch (parseError) {
        console.error("Erro ao parsear JSON do script Python:", parseError);
        reject(new Error("Erro ao processar dados do script Python."));
      }
    });
  });
};

const processLeadsFromPython = async (req, res) => {
  try {
    const { cidade, estado, termos } = req.body;

    if (!cidade || !estado || !termos || !Array.isArray(termos) || termos.length === 0) {
      return res.status(400).json({ error: "Cidade, estado e termos (array de strings) são obrigatórios." });
    }

    const collectedLeads = await executePythonScript(cidade, estado, termos);
    const result = await processLeads(collectedLeads);

    return res.status(200).json({
      message: "Processamento de leads concluído.",
      newLeads: result.newLeadsCount,
      discardedLeads: result.discardedLeadsCount,
    });
  } catch (error) {
    console.error("Error in processLeadsFromPython:", error);
    return res.status(500).json({ error: error.message || "Erro interno do servidor." });
  }
};

const checkAndGenerateLeads = async (req, res) => {
  try {
    const { cidade, estado, termos } = req.body;

    if (!cidade || !estado || !termos || !Array.isArray(termos) || termos.length === 0) {
      return res.status(400).json({ error: "Cidade, estado e termos (array de strings) são obrigatórios." });
    }

    const termsToGenerate = [];
    for (const term of termos) {
      const count = await countLeadsByTerm(term);
      console.log(`Termo: ${term}, Leads Disponíveis: ${count}`);
      if (count < MIN_LEADS_THRESHOLD) {
        termsToGenerate.push(term);
      }
    }

    if (termsToGenerate.length > 0) {
      console.log(`Gerando novas listas para os termos: ${termsToGenerate.join(", ")}`);
      const collectedLeads = await executePythonScript(cidade, estado, termsToGenerate);
      const result = await processLeads(collectedLeads);

      return res.status(200).json({
        message: "Verificação e geração de leads concluída.",
        termsChecked: termos,
        termsGenerated: termsToGenerate,
        newLeads: result.newLeadsCount,
        discardedLeads: result.discardedLeadsCount,
      });
    } else {
      return res.status(200).json({
        message: "Nenhum termo abaixo do limite. Nenhuma nova lista gerada.",
        termsChecked: termos,
      });
    }
  } catch (error) {
    console.error("Error in checkAndGenerateLeads:", error);
    return res.status(500).json({ error: error.message || "Erro interno do servidor." });
  }
};

const getLeads = async (req, res) => {
  try {
    const leads = await getAvailableLeads();
    return res.status(200).json(leads);
  }
  catch (error) {
    console.error("Error in getLeads:", error);
    return res.status(500).json({ error: error.message || "Erro interno do servidor." });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { leadId } = req.params;
    const { status } = req.body;
    const io = req.app.get("io");

    if (!status) {
      return res.status(400).json({ error: "Status é obrigatório." });
    }

    const updatedLead = await updateLeadStatus(leadId, status);
    if (updatedLead) {
      io.emit("leadUpdate", updatedLead);
      return res.status(200).json(updatedLead);
    } else {
      return res.status(404).json({ error: "Lead não encontrado." });
    }
  } catch (error) {
    console.error("Error in updateStatus:", error);
    return res.status(500).json({ error: error.message || "Erro interno do servidor." });
  }
};

const assignLead = async (req, res) => {
  try {
    const { leadId } = req.params;
    const { sellerId } = req.body;
    const io = req.app.get("io");

    if (!sellerId) {
      return res.status(400).json({ error: "ID do vendedor é obrigatório." });
    }

    const assignedLead = await assignLeadToSeller(leadId, sellerId);
    if (assignedLead) {
      io.emit("leadUpdate", assignedLead);
      return res.status(200).json(assignedLead);
    } else {
      return res.status(404).json({ error: "Lead não encontrado ou não disponível para atribuição." });
    }
  } catch (error) {
    console.error("Error in assignLead:", error);
    return res.status(500).json({ error: error.message || "Erro interno do servidor." });
  }
};

const getLeadById = async (req, res) => {
  try {
    const { leadId } = req.params;
    const lead = await getLeadDetails(leadId);
    if (lead) {
      return res.status(200).json(lead);
    } else {
      return res.status(404).json({ error: "Lead não encontrado." });
    }
  } catch (error) {
    console.error("Error in getLeadById:", error);
    return res.status(500).json({ error: error.message || "Erro interno do servidor." });
  }
};

const startAttendance = async (req, res) => {
  try {
    const { leadId } = req.params;
    const userId = req.user?.id;
    const io = req.app.get("io");

    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado." });
    }

    const lead = await getLeadDetails(leadId);

    if (lead.status === 'Em Atendimento' && lead.attended_by_user_id !== userId) {
      return res.status(409).json({ error: "Este lead já está sendo atendido por outro vendedor." });
    }

    const attendedLead = await startLeadAttendance(leadId, userId);
    if (attendedLead) {
      io.emit("leadUpdate", attendedLead);
      return res.status(200).json(attendedLead);
    } else {
      return res.status(404).json({ error: "Lead não encontrado." });
    }
  } catch (error) {
    if (error.message === "Este lead já está sendo atendido por outro vendedor.") {
      return res.status(409).json({ error: error.message });
    }
    return res.status(500).json({ error: error.message || "Erro interno do servidor." });
  }
};

const endAttendance = async (req, res) => {
  try {
    const { leadId } = req.params;
    const userId = req.user?.id;
    const io = req.app.get("io");
    const attendanceDetails = req.body; // Detalhes do atendimento vêm do corpo da requisição

    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado." });
    }

    // Validação básica dos attendanceDetails
    if (!attendanceDetails || !attendanceDetails.status || !attendanceDetails.last_contact_method) {
      return res.status(400).json({ error: "Status e método de contato são obrigatórios para encerrar o atendimento." });
    }

    const endedLead = await endLeadAttendance(leadId, userId, attendanceDetails);

    if (endedLead) {
      io.emit("leadUpdate", endedLead);
      return res.status(200).json(endedLead);
    } else {
      return res.status(404).json({ error: "Lead não encontrado ou não pôde ser encerrado." });
    }
  } catch (error) {
    if (error.message === "Lead não está em atendimento por este vendedor.") {
      return res.status(409).json({ error: error.message });
    }
    return res.status(500).json({ error: error.message || "Erro interno do servidor." });
  }
};

module.exports = {
  processLeadsFromPython,
  checkAndGenerateLeads,
  getLeads,
  updateStatus,
  assignLead,
  getLeadById,
  startAttendance,
  endAttendance,
};

