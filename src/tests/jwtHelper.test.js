/*
Developers:
- 20248/2022  SERGE MUNEZA
- 21939/2023  NEEMA ZANINKA
*/

import { generateAuthToken, verifyToken } from "../utils/jwtHelper.js";
import jwt from "jsonwebtoken";

// Mock environment variable
process.env.JWT_SECRET = "testsecret";

describe("JWT Helper Functions", () => {
  let token;
  const userPayload = { id: "user123", role: "user" };

  beforeAll(() => {
    token = generateAuthToken(userPayload);
  });

  it("Should generate a valid JWT token", () => {
    expect(token).toBeDefined();
    expect(typeof token).toBe("string");
  });

  it("Should fail to verify an invalid token", () => {
    expect(() => jwt.verify("invalid.token", process.env.JWT_SECRET)).toThrow();
  });

  it("Should fail to verify an expired token", () => {
    const expiredToken = jwt.sign(userPayload, process.env.JWT_SECRET, { expiresIn: "-1s" });
    expect(() => jwt.verify(expiredToken, process.env.JWT_SECRET)).toThrow();
  });

  describe("Verify Token Middleware", () => {
    const mockResponse = () => {
      const res = {};
      res.status = jest.fn().mockReturnValue(res);
      res.json = jest.fn().mockReturnValue(res);
      return res;
    };

    it("Should return 401 if no token is provided", () => {
      const req = { header: jest.fn().mockReturnValue(null) };
      const res = mockResponse();
      const next = jest.fn();

      verifyToken(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "Access denied. No token provided." });
    });

    it("Should return 403 for an invalid token", () => {
      const req = { header: jest.fn().mockReturnValue("Bearer invalid.token") };
      const res = mockResponse();
      const next = jest.fn();

      verifyToken(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: "Invalid or expired token" });
    });
  });
});
