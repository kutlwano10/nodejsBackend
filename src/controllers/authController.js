const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

exports.forgotPassword = async (req, res) => {
  try {
    const email = req.body;

    db.query(
      "SELECT * FROM users WHERE email = ?",
      [email],
      async (error, results) => {
        if (error) {
          return res.status(500).json({ message: "Database error", error });
        }
        if (results.length === 0) {
          return res.status(404).json({ message: "User Not Found" });
        }
        const token = crypto.randomBytes(32).toString("hex");
        const hashedToken = await bcrypt.hash(token, 10);

        // storing the token on to the database
        db.query(
          "INSERT INTO password_reset (email, token) VALUES (?, ?) ON DUPLICATE KEY UPDATE token = ?, created_at = NOW()",
          [email, hashedToken, hashedToken]
        );

        const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;

        const transporter = nodemailer.createTransport({
          host: process.env.EMAIL_HOST, // SMTP host
          port: process.env.EMAIL_PORT, // SMTP port
          secure: false, // true for port 465, false for 587
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });

        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: email,
          subject: "Password reset request ",
          html: `<p>Click <a href="${resetLink}"> here</a> to reset your password .</p>`,
        });
        res.json({message : "Password reset link sent to your email"})
      }
    );
  } catch (error) {
    res.status(500).json({message: "server Error", error})
  }
};

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
    const [existingUsers] = await db.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ error: "Email already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Register the user
    await db.query(
      "INSERT INTO users (name, email, password, role, position, location, idNumber, race, phoneNumber, gender) VALUES (?,?,?,?,?,?,?,?,?,?)",
      [
        name,
        email,
        hashedPassword,
        role,
        position,
        location,
        idNumber,
        race,
        phoneNumber,
        gender,
      ]
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
    const [users] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

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
