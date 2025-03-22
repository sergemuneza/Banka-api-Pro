/*
Developers:
- 20248/2022  SERGE MUNEZA
- 21939/2023  NEEMA ZANINKA
*/

import mongoose from "mongoose";

const accountSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Link to User model
    accountNumber: { type: String, unique: true, required: true },
    type: { type: String, enum: ["savings", "current"], required: true },
    balance: { type: Number, default: 0 },
    status: { type: String, enum: ["active", "dormant", "closed"], default: "active" },
  },
  { timestamps: true }
);

export default mongoose.model("Account", accountSchema);
