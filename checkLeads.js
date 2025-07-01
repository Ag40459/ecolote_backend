require("dotenv").config();

const supabase = require("./src/config/supabaseClient");

// Função para simular uma barra de progresso simples no terminal
function showProgress(current, total, message) {
  const percentage = (current / total) * 100;
  const filled = Math.floor(percentage / 5);
  const empty = 20 - filled;
  const progressBar = "[" + "=".repeat(filled) + ">".repeat(empty) + "]";
  process.stdout.write(`\r${message} ${progressBar} ${percentage.toFixed(1)}%`);
}

async function checkLeadsInDB() {
  console.log("Iniciando análise de leads no banco de dados Supabase...");
  try {
    // 1. Obter todos os leads para processamento
    let allLeads = [];
    let hasMore = true;
    let offset = 0;
    const limit = 1000; // Buscar em lotes para evitar sobrecarga

    process.stdout.write("Coletando dados do banco de dados...\n");

    while (hasMore) {
      const { data, error } = await supabase
        .from("leads")
        .select("name, formatted_phone_number, search_term, collected_at")
        .range(offset, offset + limit - 1);

      if (error) {
        console.error("\nErro ao buscar leads:", error.message);
        return;
      }

      if (data.length === 0) {
        hasMore = false;
      } else {
        allLeads = allLeads.concat(data);
        offset += data.length;
        showProgress(allLeads.length, allLeads.length + limit, "Progresso da coleta:"); // Estimativa de progresso
      }
    }
    process.stdout.write("\nDados coletados com sucesso.\n");

    const totalClients = allLeads.length;
    console.log(`\nTotal de clientes no banco de dados: ${totalClients}`);

    if (totalClients === 0) {
      console.log("Nenhum lead encontrado para análise.");
      return;
    }

    // 2. Quantidade de clientes por Termo
    const termCounts = {};
    const clientsWithoutPhone = [];
    const collectedAtTimestamps = [];

    allLeads.forEach((lead, index) => {
      if (lead.search_term) {
        termCounts[lead.search_term] = (termCounts[lead.search_term] || 0) + 1;
      }
      if (!lead.formatted_phone_number) {
        clientsWithoutPhone.push(lead);
      }
      if (lead.collected_at) {
        collectedAtTimestamps.push(new Date(lead.collected_at).getTime());
      }
      showProgress(index + 1, totalClients, "Processando leads:");
    });
    process.stdout.write("\n"); // Nova linha após a barra de progresso

    console.log("\nQuantidade de clientes por Termo:");
    if (Object.keys(termCounts).length === 0) {
      console.log("Nenhum termo encontrado.");
    } else {
      for (const term in termCounts) {
        console.log(`- ${term}: ${termCounts[term]}`);
      }
    }

    // 3. Quantidade de clientes sem número de telefone
    console.log(`\nQuantidade de clientes sem número de telefone: ${clientsWithoutPhone.length}`);

    // 4. Quantas vezes o script foi rodado (estimativa)
    // Agrupar timestamps que são muito próximos (ex: dentro de 5 segundos) como uma única execução
    collectedAtTimestamps.sort((a, b) => a - b);

    let scriptRuns = 0;
    if (collectedAtTimestamps.length > 0) {
      scriptRuns = 1; // Pelo menos uma execução se houver dados
      for (let i = 1; i < collectedAtTimestamps.length; i++) {
        // Se a diferença entre os timestamps for maior que 5 segundos, considera uma nova execução
        if (collectedAtTimestamps[i] - collectedAtTimestamps[i - 1] > 5000) {
          scriptRuns++;
        }
      }
    }
    console.log(`\nEstimativa de vezes que o script foi rodado: ${scriptRuns}`);

  } catch (e) {
    console.error("\nErro inesperado durante a análise:", e.message);
  }
}

checkLeadsInDB();