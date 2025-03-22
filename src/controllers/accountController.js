/*
Developers:
- 20248/2022  SERGE MUNEZA
- 21939/2023  NEEMA ZANINKA
*/

import Account from "../models/account.js";
import User from "../models/user.js";
import { generateAccountNumber } from "../utils/accountHelper.js";

// Create a new bank account
export const createAccount = async (req, res) => {
  try {
    const { type, initialDeposit } = req.body;
    const userId = req.user.id; // Get authenticated user ID from token

    // Ensure user exists
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Generate unique account number
    const accountNumber = generateAccountNumber();

    // Create and save the account
    const newAccount = new Account({
      owner: userId,
      accountNumber,
      type,
      balance: initialDeposit || 0,
    });

    await newAccount.save();

    res.status(201).json({ message: "Account created successfully", data: newAccount });
  } catch (error) {
    console.error("Error creating account:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

//GET ALL ACCOUNTS
export const getAllAccounts = async (req, res) => {
  try {
    console.log("User Role in Controller:", req.user.role); //Check user role

    if (!["admin", "staff"].includes(req.user.role)) {
      return res.status(403).json({ error: "Access denied. Admins and staff only." });
    }

    const accounts = await Account.find().populate("owner", "firstName lastName email");
    res.status(200).json({ data: accounts });
  } catch (error) {
    console.error("Error fetching accounts:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


export const getUserAccounts = async (req, res) => {
  try {
    const { userId } = req.params; // Get user ID from request params
    const requesterId = req.user.id; // Get ID from authenticated user
    const requesterRole = req.user.role; // Get role from authenticated user

    // Only admins/staff can view any user’s account
    if (requesterRole !== "admin" && requesterRole !== "staff") {
      //Users can only view their own accounts
      if (requesterId !== userId) {
        return res.status(403).json({ error: "Access denied. You can only view your own accounts." });
      }
    }

    //Fetch accounts for the given user ID
    const accounts = await Account.find({ owner: userId }).populate("owner", "firstName lastName email");

    if (!accounts.length) {
      return res.status(404).json({ error: "No accounts found for this user" });
    }

    res.status(200).json({ data: accounts });
  } catch (error) {
    console.error("Error fetching user accounts:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update account status (Admin & Staff)
export const updateAccountStatus = async (req, res) => {
  try {
    const { accountId } = req.params;
    const { status } = req.body;

    console.log("Role Checking:", req.user.role); // Debugging

    //Allow only Admin & Staff
    if (!["admin", "staff"].includes(req.user.role)) {
      return res.status(403).json({ error: "Access denied. Admins & Staff only." });
    }

    //Validate status
    if (!["active", "dormant", "closed"].includes(status)) {
      return res.status(400).json({ error: "Invalid account status" });
    }

    const account = await Account.findByIdAndUpdate(accountId, { status }, { new: true });
    if (!account) return res.status(404).json({ error: "Account not found" });

    res.status(200).json({ message: "Account status updated", data: account });
  } catch (error) {
    console.error("Error updating account status:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Delete an account (Admin Only)
export const deleteAccount = async (req, res) => {
  try {
    const { accountId } = req.params;

    const account = await Account.findByIdAndDelete(accountId);
    if (!account) return res.status(404).json({ error: "Account not found" });

    res.status(200).json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Error deleting account:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
