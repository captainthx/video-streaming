const express = require("express");
const { register, login } = require("../controller/authController");

const router = express.Router();

// Route สำหรับลงทะเบียน
router.post("/register", register);

// Route สำหรับเข้าสู่ระบบ
router.post("/login", login);

module.exports = router;
