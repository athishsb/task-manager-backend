const express = require("express");
const { register, login, logout, forgotPassword, resetLinkVerify, resetPassword, test } = require("../controllers/authController");
const router = express.Router();

// Routes beginning with /api/auth
router.post("/register", register);
router.post("/login", login);
router.post('/forgot-password', forgotPassword);
router.get('/reset-link-verify/:id/:token', resetLinkVerify);
router.post('/reset-password/:id/:token', resetPassword);



module.exports = router;