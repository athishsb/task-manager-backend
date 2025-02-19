const jwt = require("jsonwebtoken");
const User = require("../models/User");

const isAuthenticated = async (req, res, next) => {
    try {
        // Get token from the Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Access denied. No token provided." });
        }

        // Extract token
        const token = authHeader.split(" ")[1];

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded) {
            return res.status(401).json({ message: "Invalid or expired token. Please log in again." });
        }

        // Find user by ID from decoded token
        const user = await User.findById(decoded.id).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found. Please register." });
        }

        // Attach user to the request object
        req.user = user._id.toString();
        next();
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            return res.status(400).json({ message: "Token has expired, please login again" });
        }
        console.log("Error in isAuthenticated Middleware:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

module.exports = {
    isAuthenticated
};
