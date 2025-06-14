const supabase = require("../config/supabaseClient");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key-for-dev-only";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";

if (process.env.JWT_SECRET === "fallback-secret-key-for-dev-only" && process.env.NODE_ENV !== 'test') {
    console.warn("AVISO: Usando chave JWT de fallback. Configure JWT_SECRET no seu arquivo .env para produção!");
}

const registrarAdmin = async (req, res) => {
    const { nome_completo, email, senha } = req.body;

    if (!nome_completo || !email || !senha) {
        return res.status(400).json({ message: "Nome completo, email e senha são obrigatórios." });
    }

    if (!email.endsWith("@ecolote.com.br")) {
        return res.status(400).json({ message: "Email inválido. Apenas emails @ecolote.com.br são permitidos." });
    }

    try {
        const { data: existingAdmin, error: selectError } = await supabase
            .from("administradores")
            .select("email")
            .eq("email", email)
            .maybeSingle();

        if (selectError && selectError.code !== "PGRST116") {
             console.error("Erro ao verificar email existente:", selectError);
             return res.status(500).json({ message: "Erro ao verificar email.", error: selectError.message });
        }

        if (existingAdmin) {
            return res.status(409).json({ message: "Este email já está cadastrado." });
        }

        const salt = await bcrypt.genSalt(10);
        const senha_hash = await bcrypt.hash(senha, salt);

        const { data, error: insertError } = await supabase
            .from("administradores")
            .insert([{ nome_completo, email, senha_hash }])
            .select("id, nome_completo, email, created_at");

        if (insertError) {
            console.error("Erro ao registrar administrador no Supabase:", insertError);
            return res.status(500).json({ message: "Erro ao registrar o administrador.", error: insertError.message });
        }

        res.status(201).json({ message: "Administrador registrado com sucesso!", admin: data[0] });

    } catch (err) {
        console.error("Erro inesperado no servidor ao registrar admin:", err);
        res.status(500).json({ message: "Ocorreu um erro inesperado no servidor." });
    }
};

const loginAdmin = async (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({ message: "Email e senha são obrigatórios." });
    }

    try {
        const { data: admin, error } = await supabase
            .from("administradores")
            .select("id, email, senha_hash, nome_completo")
            .eq("email", email)
            .single();

        if (error || !admin) {
            return res.status(401).json({ message: "Credenciais inválidas." });
        }

        const senhaValida = await bcrypt.compare(senha, admin.senha_hash);
        if (!senhaValida) {
            return res.status(401).json({ message: "Credenciais inválidas." });
        }

        const payload = {
            admin: {
                id: admin.id,
                email: admin.email,
                nome_completo: admin.nome_completo
            }
        };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

        res.json({
            message: "Login bem-sucedido!",
            token,
            admin: {
                id: admin.id,
                email: admin.email,
                nome_completo: admin.nome_completo
            }
        });

    } catch (err) {
        console.error("Erro inesperado no servidor ao fazer login:", err);
        res.status(500).json({ message: "Ocorreu um erro inesperado no servidor." });
    }
};

const requestPasswordReset = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ emailExists: false, message: "O campo email é obrigatório." });
    }

    try {
        const { data: existingAdmin, error: selectError } = await supabase
            .from("administradores")
            .select("email")
            .eq("email", email)
            .maybeSingle(); 

        if (selectError && selectError.code !== 'PGRST116') { 
            console.error("Erro ao verificar email para redefinição de senha:", selectError);
            return res.status(500).json({ emailExists: false, message: "Erro ao verificar o email.", error: selectError.message });
        }

        if (existingAdmin) {
            return res.status(200).json({ emailExists: true, message: "Se o email estiver cadastrado, um link para redefinição de senha será enviado em breve." });
        } else {
            return res.status(200).json({ emailExists: false, message: "Email não cadastrado em nossa base de dados." });
        }

    } catch (err) {
        console.error("Erro inesperado no servidor ao solicitar redefinição de senha:", err);
        res.status(500).json({ emailExists: false, message: "Ocorreu um erro inesperado no servidor." });
    }
};

const buscarPessoasFisicas = async (req, res) => {
    try {
        const { data, error } = await supabase.from("pessoas_fisicas").select("*").order("created_at", { ascending: false });
        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error("Erro ao buscar pessoas físicas:", error);
        res.status(500).json({ message: "Erro ao buscar dados de pessoas físicas.", error: error.message });
    }
};

const buscarPessoasJuridicas = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("pessoas_juridicas")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) throw error;

        const pessoasJuridicasMapeadas = data.map(pj => ({
            id: pj.id,
            nome_empresa: pj.razao_social,
            cnpj: pj.cnpj,
            telefone: pj.telefone_comercial,
            modelo_imovel: pj.tipo_imovel_comercial,
            media_conta_energia: pj.media_conta_energia_pj,
            cidade: pj.cidade_pj,
            estado: pj.estado_pj,
            pretensao_pagamento: pj.pretensao_pagamento_pj,
            created_at: pj.created_at
        }));

        res.json(pessoasJuridicasMapeadas);
    } catch (error) {
        console.error("Erro ao buscar pessoas jurídicas:", error);
        res.status(500).json({ message: "Erro ao buscar dados de pessoas jurídicas.", error: error.message });
    }
};

const buscarInvestidores = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("investidores")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) throw error;

        const investidoresMapeados = data.map(inv => ({
            id: inv.id,
            nome: inv.nome_investidor,
            email: inv.email_investidor,
            telefone: inv.telefone_investidor,
            cidade: inv.cidade_investidor,
            estado: inv.estado_investidor,
            valor_investimento: inv.valor_interesse_investimento,
            created_at: inv.created_at
        }));

        res.json(investidoresMapeados);
    } catch (error) {
        console.error("Erro ao buscar investidores:", error);
        res.status(500).json({ message: "Erro ao buscar dados de investidores.", error: error.message });
    }
};

module.exports = {
    registrarAdmin,
    loginAdmin,
    requestPasswordReset,
    buscarPessoasFisicas,
    buscarPessoasJuridicas,
    buscarInvestidores
};

