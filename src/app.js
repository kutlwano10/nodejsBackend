const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const pool = require("./config/db"); // Import MySQL pool
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const projectRoutes = require("./routes/projectRoutes");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/projects", projectRoutes);

// Keep MySQL Connection Alive
setInterval(async () => {
  try {
    const connection = await pool.getConnection();
    await connection.query("SELECT 1"); // Dummy query
    connection.release();
    console.log("✅ Keep-alive query sent to MySQL");
  } catch (err) {
    console.error("❌ Database keep-alive error:", err);
  }
}, 300000); // Runs every 5 minutes

module.exports = app;
