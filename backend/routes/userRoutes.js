const expressFramework = require("express");

const userControllerFunctions = require("../controllers/userController");

const authenticationMiddleware = require("../middlewares/authMiddleware");

const userRoutes = expressFramework.Router();

const handleUserRegistration = userControllerFunctions.registerUser;
const handleUserLogin = userControllerFunctions.loginUser;
const handleGetUserProfile = userControllerFunctions.getUser;

const checkUserAuthentication = authenticationMiddleware.authMiddleware;

userRoutes.post("/register", handleUserRegistration);

userRoutes.post("/login", handleUserLogin);

userRoutes.get("/me", checkUserAuthentication, handleGetUserProfile);

module.exports = userRoutes;