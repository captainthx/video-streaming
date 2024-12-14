const path = require("path");
const fs = require("fs");
const ffmpeg = require("fluent-ffmpeg");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const ffmpegPath = require("ffmpeg-static");
const { v4: uuidv4 } = require("uuid");

// กำหนด path ของ ffmpeg
ffmpeg.setFfmpegPath(ffmpegPath);

const uploadVideo = async (req, res) => {
  try {
    const userId = req.user.id; // ใช้ userId จาก JWT
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "Please upload a file" });
    }

    const uploadDir = path.join(__dirname, "../uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const uniqueFilename = uuidv4();
    const outputPath = path.join(uploadDir, `${uniqueFilename}.m3u8`);

    ffmpeg(file.path)
      .outputOption("-hls_time 10") // เวลาของแต่ละชิ้นส่วน HLS (วินาที)
      .outputOption("-hls_playlist_type vod") // ประเภทของ Playlist
      .outputOption("-f hls")
      .output(outputPath)
      .on("error", (err) => res.status(500).json({ error: err.message }))
      .on("end", async () => {
        // สร้างวิดีโอในฐานข้อมูล
        const video = await prisma.video.create({
          data: {
            title: file.originalname,
            url: `/uploads/${file.filename}`, // ไฟล์ต้นฉบับ
            hls_url: `/uploads/${uniqueFilename}.m3u8`, // HLS URL
            userId: userId, // ใช้ userId จาก JWT
          },
        });

        res.status(201).json(video);
      })
      .run();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// การสตรีมวิดีโอ
const streamVideo = (req, res) => {
  const videoId = req.params.videoId;

  prisma.video
    .findUnique({
      where: { id: parseInt(videoId) },
    })
    .then((video) => {
      if (!video || !video.hls_url) {
        return res.status(404).json({ error: "Video not found" });
      }

      const videoPath = path.join(
        __dirname,
        "..",
        "uploads",
        video.hls_url.replace("/uploads", "")
      );

      // อ่านไฟล์ .m3u8 และปรับ URL
      fs.readFile(videoPath, "utf8", (err, data) => {
        if (err) {
          return res.status(500).json({ error: "Error reading video file" });
        }

        // แทนที่ไฟล์ .ts เป็น URL เต็ม
        const baseUrl = `${req.protocol}://${req.get(
          "host"
        )}/api/video/stream/segments/`;

        // แก้ไขการแทนที่ใน playlist ให้ไม่เกิด / ซ้ำ
        const modifiedPlaylist = data.replace(
          /([a-zA-Z0-9-_]+\.ts)/g,
          (match) => `${baseUrl}${match}`
        );
        res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
        res.send(modifiedPlaylist);
      });
    })
    .catch((err) => res.status(500).json({ error: err.message }));
};

const streamSegment = (req, res) => {
  const segmentName = req.params.segmentName;
  // ปรับเส้นทางให้ตรงกับโฟลเดอร์ uploads
  const segmentPath = path.join(
    __dirname,
    "..",
    "uploads", // ใช้โฟลเดอร์ uploads
    segmentName // ไม่ต้องใช้โฟลเดอร์ segments
  );

  res.sendFile(segmentPath, (err) => {
    if (err) {
      console.error("Error sending file:", err);
      res.status(404).send("Segment not found");
    }
  });
};

module.exports = { uploadVideo, streamVideo, streamSegment };
