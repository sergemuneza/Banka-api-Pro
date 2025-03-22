/*
Developers:
- 20248/2022  SERGE MUNEZA
- 21939/2023  NEEMA ZANINKA
*/

const express = require("express");
const { signup, signin, createStaff,requestPasswordReset, resetPassword } = require("../controllers/authController");
const { verifyToken, isAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/signup", signup);
router.post("/signin", signin);
router.post("/signup-staff", verifyToken, isAdmin, createStaff);
router.post("/password-reset/request", requestPasswordReset);
router.post("/password-reset/reset", resetPassword); 

module.exports = router; 
