/*
Developer:
- SERGE MUNEZA
*/

import express from "express";
import {
  creditAccount,
  debitAccount,
  getTransactions,
  getTransactionById,
} from "../controllers/transactionController.js";
import { isStaff, verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();


router.post("/:accountId/credit", verifyToken,isStaff, creditAccount);
router.post("/:accountId/debit", verifyToken,isStaff, debitAccount);
router.get("/:accountId/transactions", verifyToken, getTransactions);
router.get("/:transactionId", verifyToken, getTransactionById);

export default router;
