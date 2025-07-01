const express = require("express");
const cors = require("cors");
const routes = require("./routes");
const proposalRoutes = require("./routes/proposalRoutes");
const leadStatusHistoryRoutes = require("./routes/leadStatusHistoryRoutes");
const path = require("path");

console.log("DEBUG: Tipo do objeto \'routes\' importado em app.js:", typeof routes);
if (typeof routes === 'function' && routes.stack) {
    console.log("DEBUG: \'routes\' parece ser um router Express com", routes.stack.length, "camadas de middleware/rotas.");
} else {
    console.log("DEBUG: \'routes\' NÃO parece ser um router Express válido ou está vazio.", routes);
}

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos dos PDFs gerados
app.use("/generated_proposals", express.static(path.join(__dirname, "..", "generated_proposals")));

app.use("/api", routes);
app.use("/api", proposalRoutes); 
app.use("/api/leads", leadStatusHistoryRoutes);

app.get("/health", (req, res) => {
    res.status(200).json({ status: "UP", message: "Backend Ecolote está operacional." });
});
app.use((req, res, next) => {
    res.status(404).json({ message: "Rota não encontrada." });
});
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: "Ocorreu um erro interno no servidor." });
});

module.exports = app;


