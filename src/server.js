const app = require("./app");
const { port } = require("./config/environment");
const http = require("http");
const socketIo = require("socket.io");

const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*", // Permitir todas as origens para desenvolvimento
        methods: ["GET", "POST"]
    }
});

// Passar a instância do io para o app para que os controllers possam usá-la
app.set("io", io);

io.on("connection", (socket) => {
    console.log("Novo cliente conectado");

    socket.on("disconnect", () => {
        console.log("Cliente desconectado");
    });
});

server.listen(port, () => {
    console.log(`Servidor Ecolote Backend rodando na porta ${port}`);
});

