const { processInactiveLeads } = require("../services/reactivationService");

/**
 * Job para processar leads inativos automaticamente
 * Este script pode ser executado via cron job ou scheduler
 */
async function runInactiveLeadsJob() {
  console.log(`[${new Date().toISOString()}] Iniciando job de processamento de leads inativos...`);
  
  try {
    const result = await processInactiveLeads();
    
    console.log(`[${new Date().toISOString()}] Job concluído com sucesso:`);
    console.log(`- Leads processados: ${result.processedCount}`);
    console.log(`- Leads marcados para reativação: ${result.updatedCount}`);
    
    if (result.leads && result.leads.length > 0) {
      console.log("Leads marcados para reativação:");
      result.leads.forEach(lead => {
        console.log(`  - ${lead.name} (ID: ${lead.id}) - Última interação: ${lead.last_interaction_at}`);
      });
    }
    
    return result;
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Erro no job de leads inativos:`, error);
    throw error;
  }
}

// Se executado diretamente (não importado)
if (require.main === module) {
  runInactiveLeadsJob()
    .then(() => {
      console.log("Job finalizado com sucesso.");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Job falhou:", error);
      process.exit(1);
    });
}

module.exports = { runInactiveLeadsJob };

