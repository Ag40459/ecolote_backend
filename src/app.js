const express = require("express");
const cors = require("cors");
// const routes = require("./routes"); // Será descomentado quando as rotas forem criadas

const app = express();

// Middleware para habilitar CORS (Cross-Origin Resource Sharing)
// Em um ambiente de produção, configure as origens permitidas de forma mais restrita.
app.use(cors());

// Middleware para parsear JSON no corpo das requisições
app.use(express.json());

// Middleware para parsear dados de formulário urlencoded
app.use(express.urlencoded({ extended: true }));

// Rotas da API (serão adicionadas aqui)
// app.use("/api", routes);

// Rota de health check básica
app.get("/health", (req, res) => {
    res.status(200).json({ status: "UP", message: "Backend Ecolote está operacional." });
});

// Tratamento de rotas não encontradas (404)
app.use((req, res, next) => {
    res.status(404).json({ message: "Rota não encontrada." });
});

// Tratamento de erros global (middleware de erro)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: "Ocorreu um erro interno no servidor." });
});

module.exports = app;

