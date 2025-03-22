/*
Developers:
- 20248/2022  SERGE MUNEZA
- 21939/2023  NEEMA ZANINKA
*/

import request from "supertest";
import mongoose from "mongoose";
import app from "../app.js";
import User from "../models/user.js";
import { generateAuthToken } from "../utils/jwtHelper.js";

jest.setTimeout(15000); 

let userToken, adminToken, staffToken, resetToken;
let userId, adminId, staffId;

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGO_DB_URI);
  }

  await User.deleteMany({}); 

  // Create Admin User
  const admin = await User.create({
    firstName: "Admin",
    lastName: "User",
    email: "admin@example.com",
    password: "password123",
    role: "admin",
  });

  adminId = admin._id;
  adminToken = generateAuthToken({ id: admin._id, role: "admin" });

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

  console.log("Test Users Created:", { adminId, userId });
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe("Authentication Tests", () => {
  // User Signup Tests
  it("Should register a new user", async () => {
    const res = await request(app).post("/api/v1/auth/signup").send({
      firstName: "Jane",
      lastName: "Smith",
      email: "jane@example.com",
      password: "password123",
    });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("message", "User registered successfully");
    expect(res.body).toHaveProperty("token");
  });

  it("Should not register a user with an existing email", async () => {
    const res = await request(app).post("/api/v1/auth/signup").send({
      firstName: "John",
      lastName: "Doe",
      email: "user@example.com",
      password: "password123",
    });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("error", "User already exists");
  });

  it("Should not register a user without required fields", async () => {
    const res = await request(app).post("/api/v1/auth/signup").send({
      email: "missing@example.com",
    });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("error", "All fields are required");
  });

  // User Login Tests
  it("Should login a registered user", async () => {
    const res = await request(app).post("/api/v1/auth/signin").send({
      email: "user@example.com",
      password: "password123",
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message", "Login successful");
    expect(res.body).toHaveProperty("token");
  });

  it("Should not login with incorrect password", async () => {
    const res = await request(app).post("/api/v1/auth/signin").send({
      email: "user@example.com",
      password: "wrongpassword",
    });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("error", "Invalid email or password");
  });

  it("Should not login with a non-existent email", async () => {
    const res = await request(app).post("/api/v1/auth/signin").send({
      email: "notfound@example.com",
      password: "password123",
    });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("error", "Invalid email or password");
  });

  // Staff Creation (Admin Only)
  it("Should allow admin to create a staff account", async () => {
    const res = await request(app)
      .post("/api/v1/auth/signup-staff")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        firstName: "Staff",
        lastName: "User",
        email: "staff@example.com",
        password: "password123",
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("message", "Staff account created successfully");
    expect(res.body.user.role).toBe("staff");

    staffId = res.body.user.id;
    staffToken = res.body.token;
  });

  it("Should not allow staff to create another staff", async () => {
    const res = await request(app)
      .post("/api/v1/auth/signup-staff")
      .set("Authorization", `Bearer ${staffToken}`)
      .send({
        firstName: "New Staff",
        lastName: "User",
        email: "newstaff@example.com",
        password: "password123",
      });

    expect(res.statusCode).toBe(403);
    expect(res.body).toHaveProperty("error", "Access denied. Admins only.");
  });

  // Password Reset Tests
  it("Should request password reset", async () => {
    const res = await request(app).post("/api/v1/auth/password-reset/request").send({
      email: "user@example.com",
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message", "Password reset link sent to email");
    resetToken = res.body.resetToken; // Save the reset token for next test
  });

  it("Should reset password with valid token", async () => {
    const res = await request(app).post("/api/v1/auth/password-reset/reset").send({
      token: resetToken,
      newPassword: "newpassword123",
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message", "Password reset successful");
  });

  it("Should not reset password with invalid token", async () => {
    const res = await request(app).post("/api/v1/auth/password-reset/reset").send({
      token: "invalidtoken123",
      newPassword: "newpassword123",
    });

    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty("error", "Invalid or expired token");
  });

  it("Should not allow users to register with unsupported roles", async () => {
    const res = await request(app).post("/api/v1/auth/signup").send({
      firstName: "Hacker",
      lastName: "User",
      email: "hacker@example.com",
      password: "password123",
      role: "superadmin", // Unallowed role
    });

    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty("error", "Internal server error");
  });

  it("Should not login a user with an empty email", async () => {
    const res = await request(app).post("/api/v1/auth/signin").send({
      email: "",
      password: "password123",
    });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("error", "Email and password are required");
  });

  it("Should not login a user with an empty password", async () => {
    const res = await request(app).post("/api/v1/auth/signin").send({
      email: "user@example.com",
      password: "",
    });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("error", "Email and password are required");
  });

  it("Should not request password reset for a non-existent email", async () => {
    const res = await request(app).post("/api/v1/auth/password-reset/request").send({
      email: "nonexistent@example.com",
    });

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty("error", "User not found");
  });

  it("Should not allow creating staff without authentication", async () => {
    const res = await request(app).post("/api/v1/auth/signup-staff").send({
      firstName: "Unauthorized",
      lastName: "Staff",
      email: "unauthorizedstaff@example.com",
      password: "password123",
    });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty("error", "Access denied. No token provided.");
  });

  it("Should not allow creating staff with missing required fields", async () => {
    const res = await request(app)
      .post("/api/v1/auth/signup-staff")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        firstName: "Incomplete",
        lastName: "Staff",
        email: "",
        password: "password123",
      });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("error", "All fields are required");
  });

});
