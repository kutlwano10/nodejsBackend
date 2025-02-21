const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

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

  try {
    // Check if user already exists
    const [existingUsers] = await db.query("SELECT * FROM users WHERE email = ?", [email]);

    if (existingUsers.length > 0) {
      return res.status(400).json({ error: "Email already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Register the user
    await db.query(
      "INSERT INTO users (name, email, password, role, position, location, idNumber, race, phoneNumber, gender) VALUES (?,?,?,?,?,?,?,?,?,?)",
      [name, email, hashedPassword, role, position, location, idNumber, race, phoneNumber, gender]
    );

    res.status(201).json({ message: "User Registered Successfully" });

  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Server Error" });
  }
};

exports.login = async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ error: "All fields are required!" });
  }

  try {
    const [users] = await db.query("SELECT * FROM users WHERE email = ?", [email]);

    if (users.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = users[0];
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

    res.json({ message: "Login successful", token, user });

  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Server Error" });
  }
};