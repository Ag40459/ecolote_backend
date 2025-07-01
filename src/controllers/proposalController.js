const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const supabase = require("../config/supabaseClient");

const generateProposal = async (req, res) => {
    const leadId = req.params.leadId;
    const proposalData = req.body; // Dados da proposta enviados pelo frontend

    // Caminho para o script Python
    const pythonScriptPath = path.join(__dirname, "../Utils/Proposals/generate_proposal.py");
    
    // Caminho para salvar o PDF gerado
    const outputDir = path.join(__dirname, "../../generated_proposals");
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    const outputPdfName = `proposal_${leadId}.pdf`;
    const outputPdfPath = path.join(outputDir, outputPdfName);

    try {
        // Executar o script Python
        const pythonProcess = exec(`python3 ${pythonScriptPath} "${outputPdfPath}"`, (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                console.error(`Python Error: ${stderr}`);
                return res.status(500).json({ message: "Erro ao gerar proposta", error: stderr });
            }
            console.log(`Python Output: ${stdout}`);

            const pdfUrl = `/generated_proposals/${outputPdfName}`; // URL acessível pelo frontend

            // Atualizar o PostgreSQL com a proposal_url
            supabase
                .from("leads")
                .update({ proposal_url: pdfUrl, proposal_generated_at: new Date().toISOString() })
                .eq("id", leadId)
                .then(({ data, error }) => {
                    if (error) {
                        console.error("Erro ao atualizar lead com URL da proposta:", error);
                        return res.status(500).json({ message: "Proposta gerada, mas erro ao atualizar lead no DB.", error: error.message });
                    }
                    res.status(200).json({ message: "Proposta gerada com sucesso!", pdfUrl: pdfUrl });
                });
        });

        // Enviar os dados da proposta para o script Python via stdin
        pythonProcess.stdin.write(JSON.stringify(proposalData));
        pythonProcess.stdin.end();

    } catch (error) {
        console.error("Erro ao iniciar processo Python:", error);
        res.status(500).json({ message: "Erro interno do servidor", error: error.message });
    }
};

module.exports = { generateProposal };