/*
Developers:
- 20248/2022  SERGE MUNEZA
- 21939/2023  NEEMA ZANINKA
*/
import Transaction from "../models/Transaction.js";
import Account from "../models/account.js";

// Deposit Money (Credit) - Staff Only
export const creditAccount = async (req, res) => {
  try {
    if (!req.user?.id) {
      console.error("Missing User ID in Token:", req.user);
      return res.status(403).json({ error: "Invalid token: User ID missing" });
    }
    console.log("🔍 Token Decoded:", req.user);

    const { accountId } = req.params;
    const { amount } = req.body;

    if (req.user.role !== "staff") {
      return res.status(403).json({ error: "Access denied. Only staff can process transactions" });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount. Must be greater than zero." });
    }

    const account = await Account.findById(accountId);
    if (!account) return res.status(404).json({ error: "Account not found" });

    account.balance += amount;
    await account.save();

    const transaction = await Transaction.create({
      accountId,
      cashierId: req.user.id,
      type: "credit",
      amount,
      newBalance: account.balance,
    });

    res.status(201).json({
      message: "Account credited successfully",
      data: transaction,
    });
  } catch (error) {
    console.error("Credit Transaction Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Withdraw Money (Debit) - Staff Only
export const debitAccount = async (req, res) => {
  try {
    if (!req.user?.id) {
      console.error("Missing User ID in Token:", req.user);
      return res.status(403).json({ error: "Invalid token: User ID missing" });
    }
    console.log("Token Decoded:", req.user);

    const { accountId } = req.params;
    const { amount } = req.body;

    if (req.user.role !== "staff") {
      return res.status(403).json({ error: "Access denied. Only staff can process transactions" });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount. Must be greater than zero." });
    }

    const account = await Account.findById(accountId);
    if (!account) return res.status(404).json({ error: "Account not found" });

    if (account.balance < amount) {
      return res.status(400).json({ error: "Insufficient funds" });
    }

    account.balance -= amount;
    await account.save();

    const transaction = await Transaction.create({
      accountId,
      cashierId: req.user.id,
      type: "debit",
      amount,
      newBalance: account.balance,
    });

    res.status(201).json({
      message: "Account debited successfully",
      data: transaction,
    });
  } catch (error) {
    console.error("Debit Transaction Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get Transaction History (User only)
export const getTransactions = async (req, res) => {
  try {
    if (!req.user?.id) {
      console.error("Missing User ID in Token:", req.user);
      return res.status(403).json({ error: "Invalid token: User ID missing" });
    }
    console.log("Token Decoded:", req.user);

    const { accountId } = req.params;

    const account = await Account.findOne({ _id: accountId, owner: req.user.id });
    if (!account) return res.status(404).json({ error: "Account not found or unauthorized" });

    const transactions = await Transaction.find({ accountId });
    console.log("Retrieved Transactions:", transactions); // Debug log

    if (!transactions || !Array.isArray(transactions)) {
      throw new Error("Transactions not found or invalid format");
    }

    const sortedTransactions = transactions.sort((a, b) => b.createdAt - a.createdAt); // Sorting locally

    res.status(200).json({ data: sortedTransactions });
  } catch (error) {
    console.error("Get Transactions Error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get a Specific Transaction (User only)
export const getTransactionById = async (req, res) => {
  try {
    if (!req.user?.id) {
      console.error("Missing User ID in Token:", req.user);
      return res.status(403).json({ error: "Invalid token: User ID missing" });
    }
    console.log("Token Decoded:", req.user);

    const { transactionId } = req.params;

    const transaction = await Transaction.findById(transactionId);
    if (!transaction) return res.status(404).json({ error: "Transaction not found" });

    const account = await Account.findOne({ _id: transaction.accountId, owner: req.user.id });
    if (!account) return res.status(403).json({ error: "Unauthorized access to transaction" });

    res.status(200).json({ data: transaction });
  } catch (error) {
    console.error("Get Transaction Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
