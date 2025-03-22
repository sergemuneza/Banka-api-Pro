/*
Developers:
- 20248/2022  SERGE MUNEZA
- 21939/2023  NEEMA ZANINKA
*/

import express from "express";
import {
  createAccount,
  getAllAccounts,
  getUserAccounts,
  updateAccountStatus,
  deleteAccount,
} from "../controllers/accountController.js";
import { verifyToken, isAdmin, adminOrStaffAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", verifyToken, createAccount); // Create a bank account
router.get("/user/:userId", verifyToken, getUserAccounts);
router.get("/", verifyToken, adminOrStaffAuth, getAllAccounts);
router.patch("/:accountId/status", verifyToken, adminOrStaffAuth, updateAccountStatus);
router.delete("/:accountId", verifyToken, isAdmin, deleteAccount);

export default router;
