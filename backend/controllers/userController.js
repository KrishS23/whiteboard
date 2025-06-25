const UserDatabaseModel = require("../models/userModel");
const jwtTokenLibrary = require("jsonwebtoken");
const JWT_SECRET_CODE = "your_secret_key";

exports.handleUserRegistration = async (requestData, responseData) => {
    try {
        const { email, password } = requestData.body;
        
        if (!email || !password) {
            return responseData.status(400).json({ error: "All fields are required" });
        }
        
        const userWithSameEmail = await UserDatabaseModel.findOne({ email });
        if (userWithSameEmail) {
            return responseData.status(400).json({ error: "User already exists" });
        }
        
        const freshUserAccount = new UserDatabaseModel({ email, password });
        await freshUserAccount.save();
        
        responseData.status(201).json({ message: "User registered successfully!" });
        
    } catch (registrationError) {
        responseData.status(500).json({ 
            error: "Registration failed", 
            details: registrationError.message 
        });
    }
};

exports.handleUserLogin = async (requestData, responseData) => {
    try {
        const { email, password } = requestData.body;
        
        const foundUserAccount = await UserDatabaseModel.findOne({ email });
        if (!foundUserAccount) {
            return responseData.status(400).json({ error: "Invalid credentials" });
        }
        
        const passwordMatches = await foundUserAccount.verifyUserPassword(password);
        if (!passwordMatches) {
            return responseData.status(400).json({ error: "Invalid credentials" });
        }
        
        const authenticationToken = jwtTokenLibrary.sign(
            { userId: foundUserAccount._id }, 
            JWT_SECRET_CODE, 
            { expiresIn: "7d" }
        );
        
        responseData.json({ 
            message: "Login successful", 
            token: authenticationToken 
        });
        
    } catch (loginError) {
        responseData.status(500).json({ 
            error: "Login failed", 
            details: loginError.message 
        });
    }
};

exports.handleGetUserProfile = async (requestData, responseData) => {
    try {
        const userProfileData = await UserDatabaseModel.findById(requestData.userId).select("-password");
        
        if (!userProfileData) {
            return responseData.status(404).json({ error: "User not found" });
        }
        
        responseData.json(userProfileData);
        
    } catch (profileError) {
        responseData.status(500).json({ 
            error: "Failed to get user", 
            details: profileError.message 
        });
    }
};