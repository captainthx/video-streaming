const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const authRoutes = require("./routers/authRouters");
const app = express();

app.use(express.json());
app.use(cors());

app.use("/api/auth", authRoutes);

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
