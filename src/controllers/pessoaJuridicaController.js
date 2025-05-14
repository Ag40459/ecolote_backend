const supabase = require("../config/supabaseClient");

// Controlador para Pessoas Jurídicas

/**
 * @route POST /api/pessoas-juridicas
 * @description Cria um novo registro de pessoa jurídica.
 * @access Public
 */
const criarPessoaJuridica = async (req, res) => {
    // Campos esperados do frontend. É importante que o frontend envie os dados
    // com nomes que possam ser mapeados para as colunas do banco.
    const {
        razao_social, // direto para razao_social
        nome_fantasia, // direto para nome_fantasia
        cnpj, // direto para cnpj
        telefone_comercial, // direto para telefone_comercial
        email_comercial, // direto para email_comercial
        nome_responsavel, // direto para nome_responsavel
        telefone_responsavel, // direto para telefone_responsavel
        tipo_imovel_comercial, // direto para tipo_imovel_comercial
        outro_tipo_imovel_comercial, // direto para outro_tipo_imovel_comercial
        media_conta_energia_pj, // direto para media_conta_energia_pj
        cep_pj, // direto para cep_pj
        rua_pj, // direto para rua_pj
        numero_pj, // direto para numero_pj
        complemento_pj, // direto para complemento_pj
        bairro_pj, // direto para bairro_pj
        cidade_pj, // direto para cidade_pj
        estado_pj, // direto para estado_pj
        pretensao_pagamento_pj // direto para pretensao_pagamento_pj
    } = req.body;

    // Validação básica - Certifique-se de que o frontend envia todos os campos NOT NULL do banco
    if (!razao_social || !cnpj || !telefone_comercial || !email_comercial || !nome_responsavel || !telefone_responsavel || !tipo_imovel_comercial || !media_conta_energia_pj || !cep_pj || !rua_pj || !numero_pj || !bairro_pj || !cidade_pj || !estado_pj || !pretensao_pagamento_pj) {
        return res.status(400).json({ message: "Todos os campos obrigatórios (identificados como NOT NULL no schema do banco) devem ser preenchidos." });
    }

    // Validação para campo condicional (outro_tipo_imovel_comercial)
    if (tipo_imovel_comercial === "Outro" && !outro_tipo_imovel_comercial) {
        return res.status(400).json({ message: "O campo 'Outro Tipo de Imóvel Comercial' é obrigatório quando 'Outro' é selecionado." });
    }

    try {
        const insertData = {
            razao_social,
            nome_fantasia: nome_fantasia || null, // Permite nulo se não enviado
            cnpj,
            telefone_comercial,
            email_comercial,
            nome_responsavel,
            telefone_responsavel,
            tipo_imovel_comercial,
            outro_tipo_imovel_comercial: tipo_imovel_comercial === "Outro" ? outro_tipo_imovel_comercial : null,
            media_conta_energia_pj,
            cep_pj,
            rua_pj,
            numero_pj,
            complemento_pj: complemento_pj || null, // Permite nulo se não enviado
            bairro_pj,
            cidade_pj,
            estado_pj,
            pretensao_pagamento_pj
        };

        const { data, error } = await supabase
            .from("pessoas_juridicas")
            .insert([insertData])
            .select(); // Retorna o registro inserido

        if (error) {
            console.error("Erro ao inserir pessoa jurídica no Supabase:", error);
            return res.status(500).json({ 
                message: "Erro ao salvar os dados da pessoa jurídica.", 
                error: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
            });
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