const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key-for-dev-only";

/**
 * Middleware para verificar o token JWT e proteger rotas.
 */
const protegerRota = (req, res, next) => {
    const authHeader = req.header("Authorization");

    if (!authHeader) {
        return res.status(401).json({ message: "Acesso negado. Nenhum token fornecido." });
    }

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
        req.user = decoded; // Armazena os dados do usuário decodificados no objeto da requisição
        next();
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

