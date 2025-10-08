/*
Developer:
- SERGE MUNEZA
*/

import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", verifyToken, (req, res) => {
  res.status(200).json({ message: "Authorized access" });
});

export default router;
