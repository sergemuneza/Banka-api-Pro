/*
Developer:
- SERGE MUNEZA
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
