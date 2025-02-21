const db = require('../config/db');

exports.getUsers = async (req, res) => {
  try {
    const [results] = await db.query("SELECT * FROM users"); // ✅ Use await
    res.status(200).json({ success: true, data: results });
  } catch (err) {
    console.error("Database error:", err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getEmployees = (req, res) => {
  const role = 'employee';
  db.query('SELECT * FROM users WHERE role = ?', [role], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Server error' });
    }
    res.status(200).json({ success: true, data: results });
  });
};