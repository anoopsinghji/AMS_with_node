const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { authenticateToken } = require("../middleware/auth");
const User = require("../models/User");

const router = express.Router();

router.post("/register", async (req, res) => {
  const { id, name, password, role, assignedClass } = req.body;

  if (!id || !password || !role) {
    return res.status(400).json({ error: "id, password and role are required" });
  }

  if (!["principal", "teacher"].includes(role)) {
    return res.status(400).json({ error: "role must be principal or teacher" });
  }

  try {
    const existingUser = await User.findOne({ id }).lean();
    if (existingUser) {
      return res.status(409).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id,
      name: name || id,
      password: hashedPassword,
      role,
    };

    if (role === "teacher") {
      newUser.assignedClass = assignedClass || "";
    }

    await User.create(newUser);
    return res.status(201).json({ message: "User registered", userId: id });
  } catch (error) {
    console.error("Register error:", error.message);
    return res.status(500).json({ error: "Could not save user" });
  }
});

router.post("/login", async (req, res) => {
  const { id, password } = req.body;

  if (!id || !password) {
    return res.status(400).json({ error: "id and password are required" });
  }

  try {
    const user = await User.findOne({ id }).lean();
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const matched = await bcrypt.compare(password, user.password);
    if (!matched) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.json({
      message: "Login successful",
      token,
      user: { id: user.id, role: user.role, name: user.name || "" },
    });
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).json({ error: "Login failed" });
  }
});

router.get("/me", authenticateToken, (req, res) => {
  return res.json({ user: req.user });
});

module.exports = router;
