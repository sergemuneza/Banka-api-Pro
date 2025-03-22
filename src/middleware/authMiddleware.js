/*
Developers:
- 20248/2022  SERGE MUNEZA
- 21939/2023  NEEMA ZANINKA
*/

import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

// Verify Token Middleware
export const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");
    if (!authHeader) {
      return res.status(401).json({ error: "Access denied. No token provided." });
    }

    const token = authHeader.split(" ")[1]; // Extract Bearer token
    if (!token) {
      return res.status(401).json({ error: "Invalid token format. Use 'Bearer <token>'" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error("Token Verification Error:", err.message); 
    res.status(403).json({ error: "Invalid or expired token" });
  }
};

// Staff Middleware
export const isStaff = (req, res, next) => {
  if (!req.user || req.user.role !== "staff") {
    return res.status(403).json({ error: "Access denied. Staff only." });
  }
  next();
};

//Admin or Staff Middleware
export const adminOrStaffAuth = (req, res, next) => {
  console.log("🔍 Middleware Role Check:", req.user?.role); 

  if (!req.user || !["admin", "staff"].includes(req.user.role)) {
    return res.status(403).json({ error: "Access denied. Admins and staff only." });
  }

  next();
};

// Admin Middleware
export const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Access denied. Admins only." });
  }
  next();
};
