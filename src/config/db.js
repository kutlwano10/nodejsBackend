const mysql = require("mysql2/promise"); // ✅ Remove `.js`
const dotenv = require("dotenv");

dotenv.config();

// Create a MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

console.log("✅ MySQL Pool created...");

module.exports = pool; // ✅ No `.promise()`