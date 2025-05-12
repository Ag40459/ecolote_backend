const supabase = require("../config/supabaseClient");

// Controlador para Pessoas Jurídicas

/**
 * @route POST /api/pessoas-juridicas
 * @description Cria um novo registro de pessoa jurídica.
 * @access Public
 */
const criarPessoaJuridica = async (req, res) => {
    const {
        nome_empresa,
        cnpj,
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

    // Validação básica
    if (!nome_empresa || !cnpj || !telefone || !modelo_imovel || !media_conta_energia || !cep || !rua || !numero || !bairro || !cidade || !estado || !pretensao_pagamento) {
        return res.status(400).json({ message: "Todos os campos obrigatórios devem ser preenchidos." });
    }

    if (modelo_imovel === "Outro" && !outro_modelo_imovel) { // Note: "Outro" com O maiúsculo, conforme frontend
        return res.status(400).json({ message: "O campo 'Qual tipo de moradia?' é obrigatório quando 'Outro' é selecionado." });
    }

    // TODO: Adicionar validação de formato para CNPJ, telefone, CEP, média_conta_energia (numérico)

    try {
        const { data, error } = await supabase
            .from("pessoas_juridicas")
            .insert([
                {
                    nome_empresa,
                    cnpj,
                    telefone,
                    modelo_imovel,
                    outro_modelo_imovel: modelo_imovel === "Outro" ? outro_modelo_imovel : null,
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
            console.error("Erro ao inserir pessoa jurídica no Supabase:", error);
            return res.status(500).json({ message: "Erro ao salvar os dados da pessoa jurídica.", error: error.message });
        }

        res.status(201).json({ message: "Dados da pessoa jurídica salvos com sucesso!", data: data[0] });

    } catch (err) {
        console.error("Erro inesperado no servidor:", err);
        res.status(500).json({ message: "Ocorreu um erro inesperado no servidor." });
    }
};

module.exports = {
    criarPessoaJuridica
};

