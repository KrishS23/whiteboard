const expressFramework = require("express");

const canvasControllerFunctions = require("../controllers/canvasController");

const authenticationMiddleware = require("../middlewares/authMiddleware");

const canvasRoutes = expressFramework.Router();

const handleCanvasCreation = canvasControllerFunctions.createCanvas;
const handleCanvasUpdate = canvasControllerFunctions.updateCanvas;
const handleCanvasLoad = canvasControllerFunctions.loadCanvas;
const handleCanvasShare = canvasControllerFunctions.shareCanvas;
const handleCanvasUnshare = canvasControllerFunctions.unshareCanvas;
const handleCanvasDeletion = canvasControllerFunctions.deleteCanvas;
const handleGetUserCanvases = canvasControllerFunctions.getUserCanvases;

const checkUserAuthentication = authenticationMiddleware.authMiddleware;

canvasRoutes.post("/create", checkUserAuthentication, handleCanvasCreation);

canvasRoutes.put("/update", checkUserAuthentication, handleCanvasUpdate);

canvasRoutes.get("/load/:id", checkUserAuthentication, handleCanvasLoad);

canvasRoutes.put("/share/:id", checkUserAuthentication, handleCanvasShare);

canvasRoutes.put("/unshare/:id", checkUserAuthentication, handleCanvasUnshare);

canvasRoutes.delete("/delete/:id", checkUserAuthentication, handleCanvasDeletion);

canvasRoutes.get("/list", checkUserAuthentication, handleGetUserCanvases);

module.exports = canvasRoutes;