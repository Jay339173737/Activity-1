const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../config/db");
const { authRequired, signToken } = require("../middleware/auth");

const router = express.Router();

router.post("/register", async (req, res) => {
  const { email, password, timezone } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "email and password required" });
  if (password.length < 6) return res.status(400).json({ error: "password must be 6+ chars" });

  const exists = db.prepare("SELECT id FROM users WHERE email = ?").get(email.toLowerCase());
  if (exists) return res.status(409).json({ error: "email already registered" });

  const hash = await bcrypt.hash(password, 10);
  const info = db
    .prepare("INSERT INTO users (email, password_hash, timezone) VALUES (?, ?, ?)")
    .run(email.toLowerCase(), hash, timezone || "UTC");

  const user = { id: info.lastInsertRowid, email: email.toLowerCase() };
  res.status(201).json({ token: signToken(user), user });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get((email || "").toLowerCase());
  if (!user || !(await bcrypt.compare(password || "", user.password_hash)))
    return res.status(401).json({ error: "invalid credentials" });

  res.json({
    token: signToken(user),
    user: { id: user.id, email: user.email, timezone: user.timezone },
  });
});

router.get("/me", authRequired, (req, res) => {
  const user = db.prepare("SELECT id, email, timezone, created_at FROM users WHERE id = ?").get(req.user.id);
  res.json(user);
});

module.exports = router;
