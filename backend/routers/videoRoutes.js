const express = require("express");
const multer = require("multer");
const path = require("path");
const {
  uploadVideo,
  streamVideo,
  streamSegment,
} = require("../controller/videoController");
const { authenticate } = require("../controller/authController");

const router = express.Router();

// การตั้งค่าการเก็บไฟล์
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "./uploads"),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const upload = multer({ storage });

// เส้นทางการอัปโหลดวิดีโอที่ต้องการ JWT Authentication
router.post("/upload", authenticate, upload.single("video"), uploadVideo);

// เส้นทางการสตรีมมิ่งวิดีโอ
router.get("/stream/:videoId", streamVideo);

// เสิร์ฟไฟล์ .ts Segment
router.get("/stream/segments/:segmentName", streamSegment);

module.exports = router;
