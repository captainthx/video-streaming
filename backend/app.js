const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const authRoutes = require("./routers/authRouters");
const videoRoutes = require("./routers/videoRoutes");
const path = require("path");
const app = express();

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.sendFile(path.resolve(__dirname, "..", "frontend", "index.html"));
});
app.use("/api/auth", authRoutes);
app.use("/api/video", videoRoutes);

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
