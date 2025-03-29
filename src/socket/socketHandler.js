const socketIo = require("socket.io");
const DataModel = require("../models/DataModel");

const setupSocket = (server) => {
    const io = socketIo(server, { cors: { origin: "*" } });

    io.on("connection", (socket) => {
        console.log("Client connected");

        socket.on("requestData", async () => {
            const data = await DataModel.find().sort({ timestamp: -1 }).limit(10);
            socket.emit("newData", data);
        });

        socket.on("disconnect", () => {
            console.log("Client disconnected");
        });
    });

    return io;
};

module.exports = { setupSocket };
