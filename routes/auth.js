const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { readJson, writeJson } = require("../utils/fileStore");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

router.post("/register", async (req, res) => {
  const { id, name, password, role, assignedClass } = req.body;

  if (!id || !password || !role) {
    return res.status(400).json({ error: "id, password and role are required" });
  }

  if (!["principal", "teacher"].includes(role)) {
    return res.status(400).json({ error: "role must be principal or teacher" });
  }

  const users = readJson("users.json", []);
  if (users.some((user) => user.id === id)) {
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

  users.push(newUser);
  const saved = writeJson("users.json", users);
  if (!saved) {
    return res.status(500).json({ error: "Could not save user" });
  }

  return res.status(201).json({ message: "User registered", userId: id });
});

router.post("/login", async (req, res) => {
  const { id, password } = req.body;

  if (!id || !password) {
    return res.status(400).json({ error: "id and password are required" });
  }

  const users = readJson("users.json", []);
  if (!Array.isArray(users) || users.length === 0) {
    return res.status(500).json({ error: "User store is empty" });
  }

  const user = users.find((u) => u.id === id);
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
});

router.get("/me", authenticateToken, (req, res) => {
  return res.json({ user: req.user });
});

module.exports = router;
