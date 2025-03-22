import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

// Generate JWT Token
export const generateAuthToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role }, // Ensures `id` and `role` are included
    process.env.JWT_SECRET,
    { expiresIn: "1d" } // Token valid for 1 day
  );
};

// Verify JWT Token Middleware
export const verifyToken = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1]; // Extract token

  if (!token) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next(); // Proceed to the next middleware
  } catch (err) {
    res.status(403).json({ error: "Invalid or expired token" });
  }
};
