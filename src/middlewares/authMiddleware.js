const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key-for-dev-only";

/**
 * Middleware para verificar o token JWT e proteger rotas.
 */
const protegerRota = (req, res, next) => {
    // Obter o token do header Authorization
    const authHeader = req.header("Authorization");

    if (!authHeader) {
        return res.status(401).json({ message: "Acesso negado. Nenhum token fornecido." });
    }

    // O token geralmente vem no formato "Bearer <token>"
    const tokenParts = authHeader.split(" ");
    if (tokenParts.length !== 2 || tokenParts[0] !== "Bearer") {
        return res.status(401).json({ message: "Token malformado." });
    }

    const token = tokenParts[1];

    if (!token) {
        return res.status(401).json({ message: "Acesso negado. Nenhum token fornecido." });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.admin = decoded.admin; // Adiciona os dados do admin decodificados ao objeto da requisição
        next(); // Passa para o próximo middleware ou rota
    } catch (ex) {
        console.error("Erro na verificação do token:", ex.message);
        if (ex.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Token expirado." });
        }
        if (ex.name === "JsonWebTokenError") {
            return res.status(401).json({ message: "Token inválido." });
        }
        res.status(400).json({ message: "Token inválido ou expirado." });
    }
};

module.exports = protegerRota;

