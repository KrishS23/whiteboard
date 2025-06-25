const jwt = require("jsonwebtoken");
const SECRET_KEY = "your_secret_key";

exports.authMiddleware = (req, res, next) => {
    const authToken = req.header("Authorization");
    
    if (!authToken) return res.status(401).json({ error: "Access Denied: No Token" });
    
    try {
        const verifiedToken = jwt.verify(authToken.replace("Bearer ", ""), SECRET_KEY);
        req.userId = verifiedToken.userId;
        next();
    } catch (tokenError) {
        res.status(401).json({ error: "Invalid Token" });
    }
};