const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// การลงทะเบียนผู้ใช้
const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // ตรวจสอบว่าผู้ใช้มีอยู่แล้วหรือไม่
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    // สร้างผู้ใช้ใหม่
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: await bcrypt.hash(password, 10),
      },
    });

    // สร้าง JWT
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN,
      }
    );

    res
      .status(201)
      .json({ message: "register successfully!", access_token: token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// การเข้าสู่ระบบ (Login)
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // ค้นหาผู้ใช้ในฐานข้อมูล
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return res.status(400).json({ message: "Invalid username" });
    }

    // ตรวจสอบรหัสผ่าน
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid  password" });
    }

    // สร้าง JWT
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN,
      }
    );

    res
      .status(200)
      .json({ message: "login successfuly!", access_token: token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ฟังก์ชันสำหรับการตรวจสอบ JWT (Authentication Middleware)
const authenticate = (req, res, next) => {
  const token = req.header("Authorization");
  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: "Token is not valid" });
  }
};

module.exports = { register, login, authenticate };
