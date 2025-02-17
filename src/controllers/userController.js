const db = require('../config/db');

exports.getUsers = (req, res) => {
  db.query('SELECT * FROM users', (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Server error' });
    }
    res.status(200).json({ success: true, data: results });
  });
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