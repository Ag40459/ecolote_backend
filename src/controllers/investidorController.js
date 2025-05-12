const supabase = require("../config/supabaseClient");

// Controlador para Investidores

/**
 * @route POST /api/investidores
 * @description Cria um novo registro de investidor.
 * @access Public
 */
const criarInvestidor = async (req, res) => {
    const {
        nome,
        email,
        telefone,
        cidade,
        estado,
        valor_investimento
    } = req.body;

    // Validação básica
    if (!nome || !email || !telefone || !cidade || !estado || !valor_investimento) {
        return res.status(400).json({ message: "Todos os campos obrigatórios devem ser preenchidos." });
    }

    // TODO: Adicionar validação de formato para email, telefone, estado (UF)

    try {
        const { data, error } = await supabase
            .from("investidores")
            .insert([
                {
                    nome,
                    email,
                    telefone,
                    cidade,
                    estado,
                    valor_investimento
                }
            ])
            .select();

        if (error) {
            console.error("Erro ao inserir investidor no Supabase:", error);
            return res.status(500).json({ message: "Erro ao salvar os dados do investidor.", error: error.message });
        }

        res.status(201).json({ message: "Dados do investidor salvos com sucesso!", data: data[0] });

    } catch (err) {
        console.error("Erro inesperado no servidor:", err);
        res.status(500).json({ message: "Ocorreu um erro inesperado no servidor." });
    }
};

module.exports = {
    criarInvestidor
};

