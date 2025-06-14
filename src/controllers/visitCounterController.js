const supabase = require("../config/supabaseClient");

const recordVisit = async (req, res) => {
    try {
        const { uniqueIdentifier } = req.body;

        if (!uniqueIdentifier) {
            return res.status(400).json({ message: "Identificador único é obrigatório." });
        }

        const { data, error } = await supabase
            .from("visitas_unicas")
            .insert([{ identificador_unico: uniqueIdentifier }])
            .select("id");

        if (error && error.code !== "23505") {
            console.error("Erro ao registrar visita única:", error);
            return res.status(500).json({ message: "Erro ao registrar visita.", error: error.message });
        }

        if (error && error.code === "23505") {
            return res.status(200).json({ message: "Visita já registrada anteriormente." });
        }

        res.status(201).json({ message: "Visita única registrada com sucesso!", visit: data[0] });

    } catch (err) {
        console.error("Erro inesperado no servidor ao registrar visita:", err);
        res.status(500).json({ message: "Ocorreu um erro inesperado no servidor." });
    }
};

const getTotalVisits = async (req, res) => {
    try {
        const { count, error } = await supabase
            .from("visitas_unicas")
            .select("id", { count: "exact", head: true });

        if (error) {
            console.error("Erro ao buscar total de visitas:", error);
            return res.status(500).json({ message: "Erro ao buscar total de visitas.", error: error.message });
        }

        res.status(200).json({ totalVisits: count });

    } catch (err) {
        console.error("Erro inesperado no servidor ao buscar total de visitas:", err);
        res.status(500).json({ message: "Ocorreu um erro inesperado no servidor." });
    }
};

module.exports = {
    recordVisit,
    getTotalVisits
};