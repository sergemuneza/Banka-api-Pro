/*
Developers:
- 20248/2022  SERGE MUNEZA
- 21939/2023  NEEMA ZANINKA
*/

import request from "supertest";
import mongoose from "mongoose";
import app from "../app.js";
import User from "../models/user.js";
import Account from "../models/account.js";
import { generateAuthToken } from "../utils/jwtHelper.js";

jest.setTimeout(15000); 

let userToken, adminToken, staffToken;
let userId, adminId, staffId, accountId;

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGO_DB_URI);
  }

  await User.deleteMany({});
  await Account.deleteMany({});

  // Create Admin
  const admin = await User.create({
    firstName: "Admin",
    lastName: "User",
    email: "admin@example.com",
    password: "password123",
    role: "admin",
  });

  adminId = admin._id;
  adminToken = generateAuthToken({ id: admin._id, role: "admin" });

  // Create Staff
  const staff = await User.create({
    firstName: "Staff",
    lastName: "User",
    email: "staff@example.com",
    password: "password123",
    role: "staff",
  });

  staffId = staff._id;
  staffToken = generateAuthToken({ id: staff._id, role: "staff" });

  // Create Regular User
  const user = await User.create({
    firstName: "John",
    lastName: "Doe",
    email: "user@example.com",
    password: "password123",
    role: "user",
  });

  userId = user._id;
  userToken = generateAuthToken({ id: user._id, role: "user" });

  console.log("Test Users Created:", { adminId, staffId, userId });

  // Ensure user exists before creating an account
  const checkUser = await User.findById(userId);
  if (!checkUser) {
    throw new Error("User not found before account creation!");
  }

  // Create a Test Account
  const account = await Account.create({
    owner: userId,
    accountNumber: `BA${Date.now()}`,
    type: "savings",
    balance: 500,
  });

  accountId = account._id;
  console.log("Test Account Created:", { accountId });
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe("Account Management", () => {
  // Account Creation
  it("Should create a new bank account", async () => {
    const res = await request(app)
      .post("/api/v1/accounts")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ type: "current", initialDeposit: 100 });

    console.log("Create Account Response:", res.body);

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("message", "Account created successfully");
    expect(res.body.data).toHaveProperty("accountNumber");
  });

  it("Should not create an account without authentication", async () => {
    const res = await request(app).post("/api/v1/accounts").send({ type: "savings", initialDeposit: 200 });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("error", "Access denied. No token provided.");
  });

  // Fetch All Accounts (Admin & Staff)
  it("Should allow admin to fetch all user accounts", async () => {
    const res = await request(app)
      .get("/api/v1/accounts")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("Should allow staff to fetch all user accounts", async () => {
    const res = await request(app)
      .get("/api/v1/accounts")
      .set("Authorization", `Bearer ${staffToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("Should not allow regular user to fetch all accounts", async () => {
    const res = await request(app)
      .get("/api/v1/accounts")
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.statusCode).toBe(403);
    expect(res.body).toHaveProperty("error", "Access denied. Admins and staff only.");
  });

  // Fetch Specific User Accounts
  it("Should allow admin to fetch a user's accounts", async () => {
    const res = await request(app)
      .get(`/api/v1/accounts/user/${userId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("Should allow staff to fetch a user's accounts", async () => {
    const res = await request(app)
      .get(`/api/v1/accounts/user/${userId}`)
      .set("Authorization", `Bearer ${staffToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("Should not allow a user to fetch another user's accounts", async () => {
    const res = await request(app)
      .get(`/api/v1/accounts/user/${adminId}`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.statusCode).toBe(403);
    expect(res.body).toHaveProperty("error", "Access denied. You can only view your own accounts.");
  });

  // Update Account Status (Admin & Staff)
  it("Should allow admin to update account status", async () => {
    const res = await request(app)
      .patch(`/api/v1/accounts/${accountId}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "dormant" });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message", "Account status updated");
  });

  it("Should allow staff to update account status", async () => {
    const res = await request(app)
      .patch(`/api/v1/accounts/${accountId}/status`)
      .set("Authorization", `Bearer ${staffToken}`)
      .send({ status: "active" });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message", "Account status updated");
  });

  it("Should not allow regular user to update account status", async () => {
    const res = await request(app)
      .patch(`/api/v1/accounts/${accountId}/status`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ status: "closed" });

    expect(res.statusCode).toBe(403);
    expect(res.body).toHaveProperty("error", "Access denied. Admins and staff only.");
  });

  // Delete Account (Admin Only)
  it("Should allow admin to delete an account", async () => {
    const res = await request(app)
      .delete(`/api/v1/accounts/${accountId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message", "Account deleted successfully");
  });

  it("Should not allow staff to delete an account", async () => {
    const res = await request(app)
      .delete(`/api/v1/accounts/${accountId}`)
      .set("Authorization", `Bearer ${staffToken}`);

    expect(res.statusCode).toBe(403);
    expect(res.body).toHaveProperty("error", "Access denied. Admins only.");
  });
});
