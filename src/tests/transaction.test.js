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
  let invalidToken = "invalid.token.string";
  let expiredToken = jwt.sign({ id: "user123", role: "user" }, process.env.JWT_SECRET, { expiresIn: "-10s" });
  let accountId = new mongoose.Types.ObjectId().toString();
  let transactionId = new mongoose.Types.ObjectId().toString();

  beforeAll(() => {
    token = jwt.sign({ id: "user123", role: "user" }, process.env.JWT_SECRET, { expiresIn: "1h" });
    staffToken = jwt.sign({ id: "staff123", role: "staff" }, process.env.JWT_SECRET, { expiresIn: "1h" });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("🔹 Credit Account", () => {
    it("Should credit an account if staff", async () => {
      Account.findById.mockResolvedValue({ _id: accountId, balance: 1000, save: jest.fn() });
      Transaction.create.mockResolvedValue({ accountId, type: "credit", amount: 500, newBalance: 1500 });

      const res = await request(app)
        .post(`/api/v1/transactions/${accountId}/credit`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ amount: 500 });

      expect(res.status).toBe(201);
      expect(res.body.data.amount).toBe(500);
    });

    it("Should return 404 if account does not exist", async () => {
      Account.findById.mockResolvedValue(null);

      const res = await request(app)
        .post(`/api/v1/transactions/${accountId}/credit`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ amount: 500 });

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe("Account not found");
    });

    it("Should return 400 if amount is missing", async () => {
      const res = await request(app)
        .post(`/api/v1/transactions/${accountId}/credit`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({});

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe("Invalid amount. Must be greater than zero.");
    });

    it("Should not allow non-staff to credit an account", async () => {
      const res = await request(app)
        .post(`/api/v1/transactions/${accountId}/credit`)
        .set("Authorization", `Bearer ${token}`)
        .send({ amount: 500 });

      expect(res.status).toBe(403);
      expect(res.body.error).toBe("Access denied. Staff only.");
    });
  });

  describe("🔹 Debit Account", () => {
    it("Should debit an account if staff", async () => {
      Account.findById.mockResolvedValue({ _id: accountId, balance: 1000, save: jest.fn() });
      Transaction.create.mockResolvedValue({ accountId, type: "debit", amount: 200, newBalance: 800 });

      const res = await request(app)
        .post(`/api/v1/transactions/${accountId}/debit`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ amount: 200 });

      expect(res.status).toBe(201);
      expect(res.body.data.amount).toBe(200);
    });

    it("Should return 404 if account does not exist", async () => {
      Account.findById.mockResolvedValue(null);

      const res = await request(app)
        .post(`/api/v1/transactions/${accountId}/debit`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ amount: 200 });

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe("Account not found");
    });

    it("Should return 400 if insufficient funds", async () => {
      Account.findById.mockResolvedValue({ _id: accountId, balance: 100, save: jest.fn() });

      const res = await request(app)
        .post(`/api/v1/transactions/${accountId}/debit`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ amount: 200 });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("Insufficient funds");
    });
  });

  describe("🔹 Get Transactions", () => {
    it("Should return transaction history for a user", async () => {
      Account.findOne.mockResolvedValue({ _id: accountId, owner: "user123" });
      Transaction.find.mockResolvedValue([{ accountId, type: "credit", amount: 500 }]);

      const res = await request(app)
        .get(`/api/v1/transactions/${accountId}/transactions`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
    });

    it("Should return 404 if account does not exist", async () => {
      Account.findOne.mockResolvedValue(null);

      const res = await request(app)
        .get(`/api/v1/transactions/${accountId}/transactions`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe("Account not found or unauthorized");
    });
  });

  describe("Get Transaction By ID", () => {
    it("Should return a specific transaction", async () => {
      Transaction.findById.mockResolvedValue({ _id: transactionId, accountId, type: "debit", amount: 200 });
      Account.findOne.mockResolvedValue({ _id: accountId, owner: "user123" });

      const res = await request(app)
        .get(`/api/v1/transactions/${transactionId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.amount).toBe(200);
    });

    it("Should return 404 if transaction does not exist", async () => {
      Transaction.findById.mockResolvedValue(null);

      const res = await request(app)
        .get(`/api/v1/transactions/${transactionId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe("Transaction not found");
    });

    it("Should return 403 if user is unauthorized", async () => {
      Transaction.findById.mockResolvedValue({ _id: transactionId, accountId, type: "debit", amount: 200 });
      Account.findOne.mockResolvedValue(null); // User doesn't own the account

      const res = await request(app)
        .get(`/api/v1/transactions/${transactionId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.error).toBe("Unauthorized access to transaction");
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe("🔹 Token & Authentication Failures", () => {
    it("Should return 401 if no token is provided", async () => {
      const res = await request(app).post(`/api/v1/transactions/${accountId}/credit`).send({ amount: 500 });
  
      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Access denied. No token provided.");
    });
  
    it("Should return 403 if token is invalid", async () => {
      const res = await request(app)
        .post(`/api/v1/transactions/${accountId}/credit`)
        .set("Authorization", `Bearer invalid.token`)
        .send({ amount: 500 });
  
      expect(res.status).toBe(403);
      expect(res.body.error).toBe("Invalid or expired token");
    });
  
    it("Should return 403 if token is expired", async () => {
      const res = await request(app)
        .post(`/api/v1/transactions/${accountId}/credit`)
        .set("Authorization", `Bearer ${expiredToken}`)
        .send({ amount: 500 });
  
      expect(res.status).toBe(403);
      expect(res.body.error).toBe("Invalid or expired token");
    });
  });
  
  describe("🔹 Error Handling Tests", () => {
    it("Should return 500 if Transaction.create() fails for credit", async () => {
      Account.findById.mockResolvedValue({ _id: accountId, balance: 1000, save: jest.fn() });
      Transaction.create.mockRejectedValue(new Error("Database error"));
  
      const res = await request(app)
        .post(`/api/v1/transactions/${accountId}/credit`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ amount: 500 });
  
      expect(res.status).toBe(500);
      expect(res.body.error).toBe("Internal server error");
    });
  
    it("Should return 500 if Transaction.create() fails for debit", async () => {
      Account.findById.mockResolvedValue({ _id: accountId, balance: 1000, save: jest.fn() });
      Transaction.create.mockRejectedValue(new Error("Database error"));
  
      const res = await request(app)
        .post(`/api/v1/transactions/${accountId}/debit`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ amount: 500 });
  
      expect(res.status).toBe(500);
      expect(res.body.error).toBe("Internal server error");
    });
  
    it("Should return 500 if Transaction.find() fails when retrieving transaction history", async () => {
      Account.findOne.mockResolvedValue({ _id: accountId, owner: "user123" });
      Transaction.find.mockRejectedValue(new Error("Database error"));
  
      const res = await request(app)
        .get(`/api/v1/transactions/${accountId}/transactions`)
        .set("Authorization", `Bearer ${token}`);
  
      expect(res.status).toBe(500);
      expect(res.body.error).toBe("Internal server error");
    });
  
    it("Should return 500 if Transaction.findById() fails when retrieving a specific transaction", async () => {
      Transaction.findById.mockRejectedValue(new Error("Database error"));
  
      const res = await request(app)
        .get(`/api/v1/transactions/${transactionId}`)
        .set("Authorization", `Bearer ${token}`);
  
      expect(res.status).toBe(500);
      expect(res.body.error).toBe("Internal server error");
    });
  });
  it("Should not credit a non-existent account", async () => {
    const res = await request(app)
      .post("/api/v1/transactions/nonexistentAccount/credit")
      .set("Authorization", `Bearer ${staffToken}`)
      .send({ amount: 500 });
  
    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty("error", "Internal server error");
  });
  
  it("Should not debit a closed account", async () => {
    Account.findById.mockResolvedValue({ _id: accountId, balance: 1000, status: "closed", save: jest.fn() });
  
    const res = await request(app)
      .post(`/api/v1/transactions/${accountId}/debit`)
      .set("Authorization", `Bearer ${staffToken}`)
      .send({ amount: 200 });
  
    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty("error", "Internal server error");
  });
  
  it("Should reject transactions with an invalid token", async () => {
    const res = await request(app)
      .post(`/api/v1/transactions/${accountId}/credit`)
      .set("Authorization", `Bearer invalidToken123`)
      .send({ amount: 500 });
  
    expect(res.statusCode).toBe(403);
    expect(res.body).toHaveProperty("error", "Invalid or expired token");
  });  
  
});
