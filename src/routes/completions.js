const express = require("express");
const db = require("../config/db");
const { authRequired } = require("../middleware/auth");

const router = express.Router();
router.use(authRequired);

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Mark a habit complete for a date (defaults to client-supplied today)
router.post("/habits/:id/complete", (req, res) => {
  const habit = db
    .prepare("SELECT id FROM habits WHERE id = ? AND user_id = ?")
    .get(req.params.id, req.user.id);
  if (!habit) return res.status(404).json({ error: "habit not found" });

  const date = req.body?.date || req.headers["x-local-date"];
  if (date && !DATE_RE.test(date)) return res.status(400).json({ error: "date must be YYYY-MM-DD" });

  try {
    const info = db
      .prepare("INSERT INTO completions (habit_id, user_id, date, note) VALUES (?, ?, ?, ?)")
      .run(habit.id, req.user.id, date || new Date().toISOString().slice(0, 10), req.body?.note || "");
    res.status(201).json({ id: info.lastInsertRowid, habit_id: habit.id, date });
  } catch (e) {
    if (String(e.message).includes("UNIQUE")) return res.status(409).json({ error: "already completed for this date" });
    throw e;
  }
});

// Un-complete a single completion
router.delete("/completions/:id", (req, res) => {
  const info = db
    .prepare("DELETE FROM completions WHERE id = ? AND user_id = ?")
    .run(req.params.id, req.user.id);
  if (!info.changes) return res.status(404).json({ error: "completion not found" });
  res.json({ deleted: true });
});

// All completions for one habit, optionally in a date range
router.get("/habits/:id/completions", (req, res) => {
  const { from, to } = req.query;
  const rows = db
    .prepare(
      `SELECT * FROM completions WHERE habit_id = ? AND user_id = ?
       ${from ? "AND date >= @from" : ""} ${to ? "AND date <= @to" : ""} ORDER BY date ASC`
    )
    .all({ id: req.params.id, user: req.user.id, from, to });
  res.json(rows);
});

// Day view: every completion for the user on a given date
router.get("/completions", (req, res) => {
  const date = req.query.date;
  if (!date || !DATE_RE.test(date)) return res.status(400).json({ error: "date query param required (YYYY-MM-DD)" });
  res.json(db.prepare("SELECT * FROM completions WHERE user_id = ? AND date = ?").all(req.user.id, date));
});

module.exports = router;
