const supabase = require("../config/supabaseClient");

// Controlador para Pessoas Físicas

/**
 * @route POST /api/pessoas-fisicas
 * @description Cria um novo registro de pessoa física.
 * @access Public
 */
const criarPessoaFisica = async (req, res) => {
    const {
        nome_completo,
        telefone,
        modelo_imovel,
        outro_modelo_imovel,
        media_conta_energia,
        cep,
        rua,
        numero,
        complemento,
        bairro,
        cidade,
        estado,
        pretensao_pagamento
    } = req.body;

    // Validação básica (pode ser expandida com uma biblioteca como Joi ou express-validator)
    if (!nome_completo || !telefone || !modelo_imovel || !media_conta_energia || !cep || !rua || !numero || !bairro || !cidade || !estado || !pretensao_pagamento) {
        return res.status(400).json({ message: "Todos os campos obrigatórios devem ser preenchidos." });
    }

    if (modelo_imovel === "outro" && !outro_modelo_imovel) {
        return res.status(400).json({ message: "O campo 'Qual tipo de moradia?' é obrigatório quando 'outro' é selecionado." });
    }

    try {
        const { data, error } = await supabase
            .from("pessoas_fisicas")
            .insert([
                {
                    nome_completo,
                    telefone,
                    modelo_imovel,
                    outro_modelo_imovel: modelo_imovel === "outro" ? outro_modelo_imovel : null,
                    media_conta_energia,
                    cep,
                    rua,
                    numero,
                    complemento,
                    bairro,
                    cidade,
                    estado,
                    pretensao_pagamento
                }
            ])
            .select();

        if (error) {
            console.error("Erro ao inserir pessoa física no Supabase:", error);
            return res.status(500).json({ message: "Erro ao salvar os dados da pessoa física.", error: error.message });
        }

        res.status(201).json({ message: "Dados da pessoa física salvos com sucesso!", data: data[0] });

    } catch (err) {
        console.error("Erro inesperado no servidor:", err);
        res.status(500).json({ message: "Ocorreu um erro inesperado no servidor." });
    }
};

module.exports = {
    criarPessoaFisica
};

