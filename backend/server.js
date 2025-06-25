const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const databaseConnection = require('./config/db')
const { Server } = require("socket.io");
const http = require("http");
const CanvasDatabaseModel = require("./models/canvasModel");
const jwtTokenLibrary = require("jsonwebtoken");
const JWT_SECRET_CODE = "your_secret_key";
const userRoutes = require("./routes/userRoutes");
const canvasRoutes = require("./routes/canvasRoutes");

const expressApplication = express();

expressApplication.use(cors());
expressApplication.use(express.json());

expressApplication.use("/api/users", userRoutes);
expressApplication.use("/api/canvas", canvasRoutes);

databaseConnection();

const httpServerInstance = http.createServer(expressApplication);
const socketIOInstance = new Server(httpServerInstance, {
    cors: {
    origin: ["http://localhost:3000", "https://whiteboard-tutorial-eight.vercel.app"], 
    methods: ["GET", "POST"],
    },
});

let canvasDataStorage = {};
let updateCounter = 0;

socketIOInstance.on("connection", (clientSocket) => {
    console.log("A user connected:", clientSocket.id);

    clientSocket.on("joinCanvas", async ({ canvasId }) => {
        console.log("Joining canvas:", canvasId);
        try {
            const authenticationHeader = clientSocket.handshake.headers.authorization;
            if (!authenticationHeader || !authenticationHeader.startsWith("Bearer ")) {
                console.log("No token provided.");
                setTimeout(() => {
                    clientSocket.emit("unauthorized", { message: "Access Denied: No Token" });
                }, 100);
                return;
            }
            
            const jwtToken = authenticationHeader.split(" ")[1];
            const decodedTokenData = jwtTokenLibrary.verify(jwtToken, JWT_SECRET_CODE);
            const authenticatedUserId = decodedTokenData.userId;
            console.log("User ID:", authenticatedUserId);
            
            const canvasDocument = await CanvasDatabaseModel.findById(canvasId);
            console.log(canvasDocument)
            
            if (!canvasDocument || (String(canvasDocument.owner) !== String(authenticatedUserId) && !canvasDocument.shared.includes(authenticatedUserId))) {
                console.log("Unauthorized access.");
                setTimeout(() => {
                    clientSocket.emit("unauthorized", { message: "You are not authorized to join this canvas." });
                }, 100);
                return;
            }

            console.log(`User ${clientSocket.id} joined canvas ${canvasId}`);
            if (canvasDataStorage[canvasId]) {
                console.log(canvasDataStorage)
                clientSocket.emit("loadCanvas", canvasDataStorage[canvasId]);
            } else {
                clientSocket.emit("loadCanvas", canvasDocument.elements);
            }
        } catch (tokenVerificationError) {
            console.error(tokenVerificationError);
            clientSocket.emit("error", { message: "An error occurred while joining the canvas." });
        }
    });
    
    clientSocket.on("drawingUpdate", async ({ canvasId, elements }) => {
        try {
            canvasDataStorage[canvasId] = elements;
    
            clientSocket.to(canvasId).emit("receiveDrawingUpdate", elements);
    
            const canvasDocument = await CanvasDatabaseModel.findById(canvasId);
            if (canvasDocument) {
                await CanvasDatabaseModel.findByIdAndUpdate(canvasId, { elements }, { new: true, useFindAndModify: false });
            }
        } catch (drawingUpdateError) {
            console.error(drawingUpdateError);
        }
    });
    
    clientSocket.on("disconnect", () => {
        console.log("User disconnected:", clientSocket.id);
    });
});

httpServerInstance.listen(5000, () => console.log("Server running on port 5000"));