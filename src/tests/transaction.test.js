/*
Developers:
- 20248/2022  SERGE MUNEZA
- 21939/2023  NEEMA ZANINKA
*/

import request from "supertest";
import mongoose from "mongoose";
import app from "../app.js";
import Transaction from "../models/Transaction.js";
import Account from "../models/account.js";
import jwt from "jsonwebtoken";

jest.mock("../models/Transaction.js");
jest.mock("../models/account.js");

jest.setTimeout(15000);

describe("Transaction API Tests", () => {
  let token;
  let staffToken;
  let accountId = new mongoose.Types.ObjectId().toString();
  let transactionId = new mongoose.Types.ObjectId().toString();

  beforeAll(() => {
    token = jwt.sign({ id: "user123", role: "user" }, process.env.JWT_SECRET, { expiresIn: "1h" });
    staffToken = jwt.sign({ id: "staff123", role: "staff" }, process.env.JWT_SECRET, { expiresIn: "1h" });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Credit Account", () => {
    it("should credit an account if staff", async () => {
      Account.findById.mockResolvedValue({ _id: accountId, balance: 1000, save: jest.fn() });
      Transaction.create.mockResolvedValue({ accountId, type: "credit", amount: 500, newBalance: 1500 });

      const res = await request(app)
        .post(`/api/v1/transactions/${accountId}/credit`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ amount: 500 });

      expect(res.status).toBe(201);
      expect(res.body.data.amount).toBe(500);
    });

    it("should deny access if not staff", async () => {
      const res = await request(app)
        .post(`/api/v1/transactions/${accountId}/credit`)
        .set("Authorization", `Bearer ${token}`)
        .send({ amount: 500 });

      expect(res.status).toBe(403);
      expect(res.body.error).toBe("Access denied. Staff only.");
    });
  });

  describe("Debit Account", () => {
    it("should debit an account if staff", async () => {
      Account.findById.mockResolvedValue({ _id: accountId, balance: 1000, save: jest.fn() });
      Transaction.create.mockResolvedValue({ accountId, type: "debit", amount: 200, newBalance: 800 });

      const res = await request(app)
        .post(`/api/v1/transactions/${accountId}/debit`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ amount: 200 });

      expect(res.status).toBe(201);
      expect(res.body.data.amount).toBe(200);
    });

    it("should not allow debit if insufficient funds", async () => {
      Account.findById.mockResolvedValue({ _id: accountId, balance: 100, save: jest.fn() });
      
      const res = await request(app)
        .post(`/api/v1/transactions/${accountId}/debit`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ amount: 200 });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Insufficient funds");
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });


  describe("Get Transactions", () => {
    it("should return transaction history for a user", async () => {
      Account.findOne.mockResolvedValue({ _id: accountId, owner: "user123" });
      Transaction.find.mockResolvedValue([{ accountId, type: "credit", amount: 500 }]);
      
      const res = await request(app)
        .get(`/api/v1/transactions/${accountId}/transactions`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
    });
  });

  describe("Get Transaction By ID", () => {
    it("should return a specific transaction", async () => {
      Transaction.findById.mockResolvedValue({ _id: transactionId, accountId, type: "debit", amount: 200 });
      Account.findOne.mockResolvedValue({ _id: accountId, owner: "user123" });

      const res = await request(app)
        .get(`/api/v1/transactions/${transactionId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.amount).toBe(200);
    });
  });
});

