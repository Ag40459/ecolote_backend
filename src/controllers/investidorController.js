const supabase = require("../config/supabaseClient");

// Controlador para Investidores

/**
 * @route POST /api/investidores
 * @description Cria um novo registro de investidor.
 * @access Public
 */
const criarInvestidor = async (req, res) => {
    // Campos esperados do frontend. Ajuste os nomes aqui se o frontend enviar com nomes diferentes.
    const {
        nome, // Será mapeado para nome_investidor
        email, // Será mapeado para email_investidor
        telefone, // Será mapeado para telefone_investidor
        tipo_investidor, // direto para tipo_investidor
        area_interesse_principal, // direto para area_interesse_principal
        valor_investimento, // Será mapeado para valor_interesse_investimento
        mensagem_investidor, // direto para mensagem_investidor
        cidade, // Será mapeado para cidade_investidor
        estado // Será mapeado para estado_investidor
    } = req.body;

    if (!nome || !email || !telefone || !valor_investimento || !cidade || !estado) {
        return res.status(400).json({ message: "Todos os campos obrigatórios (nome, email, telefone, tipo_investidor, valor_investimento, cidade, estado) devem ser preenchidos." });
    }

    try {
        const insertData = {
            nome_investidor: nome,
            email_investidor: email,
            telefone_investidor: telefone,
            tipo_investidor: tipo_investidor,
            area_interesse_principal: area_interesse_principal || null, // Permite nulo se não enviado
            valor_interesse_investimento: valor_investimento,
            mensagem_investidor: mensagem_investidor || null, // Permite nulo se não enviado
            cidade_investidor: cidade, 
            estado_investidor: estado 
            // data_criacao e data_atualizacao são preenchidas automaticamente pelo banco (DEFAULT now() e triggers)
        };

        const { data, error } = await supabase
            .from("investidores")
            .insert([insertData])
            .select(); // Retorna o registro inserido

       if (error) {
    console.error("Erro ao inserir investidor no Supabase:", error);

    // Tratamento específico para e-mail duplicado
    if (error.code === "23505" && error.message.includes("email_investidor")) {
        return res.status(400).json({ 
            message: "Este e-mail já está cadastrado. Tente usar outro ou entre em contato." 
        });
    }

    return res.status(500).json({ 
        message: "Erro ao salvar os dados do investidor.", 
        error: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
    });
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