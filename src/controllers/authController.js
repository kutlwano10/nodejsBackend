const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  const {
    name,
    email,
    password,
    role,
    position,
    location,
    idNumber,
    race,
    phoneNumber,
    gender,
  } = req.body;

  // Check if user already exists
  db.query('SELECT * FROM users WHERE email = ?', [email], async (err, result) => {
    if (err) return res.status(500).json({ error: 'Database error' });

    if (result.length > 0) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Register the user
    try {
      const hashedPassword = await bcrypt.hash(password, 10);

      db.query(
        'INSERT INTO users (name, email, password, role, position, location, idNumber, race, phoneNumber, gender) VALUES (?,?,?,?,?,?,?,?,?,?)',
        [name, email, hashedPassword, role, position, location, idNumber, race, phoneNumber, gender],
        (err, result) => {
          if (err) return res.status(500).json({ error: 'Error registering user' });
          res.status(201).json({ message: 'User Registered Successfully' });
        }
      );
    } catch (error) {
      res.status(500).json({ error: 'Server Error' });
    }
  });
};

exports.login = (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role)
    // FIXED CONDITION
    return res.status(400).json({ error: "All fields are required!" });

  const query = "SELECT * FROM users WHERE email = ?";

  db.query(query, [email], async (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Server error" });
    }
    if (results.length === 0) {
      return res.status(401).json({ errors: "Invalid email or password" });
    }

    const user = results[0];
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    if (user.role !== role) {
      return res.status(403).json({ error: "Incorrect role for this email" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    return res.json({ message: "Login successful", token, user });
  })
};

