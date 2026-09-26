const express = require("express");
const db = require("../config/db");
const { authRequired } = require("../middleware/auth");

const router = express.Router();
router.use(authRequired);

// List habits (optionally include archived)
router.get("/", (req, res) => {
  const includeArchived = req.query.archived === "1";
  const habits = db
    .prepare(`SELECT * FROM habits WHERE user_id = ? ${includeArchived ? "" : "AND archived = 0"}`)
    .all(req.user.id);
  res.json(habits.map((h) => ({ ...h, schedule_days: JSON.parse(h.schedule_days) })));
});

router.post("/", (req, res) => {
  const { title, description, schedule_type, schedule_days, color, reminder_time, target_per_day } =
    req.body || {};
  if (!title?.trim()) return res.status(400).json({ error: "title required" });

  const info = db
    .prepare(
      `INSERT INTO habits (user_id, title, description, schedule_type, schedule_days, color, reminder_time, target_per_day)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      req.user.id,
      title.trim(),
      description || "",
      schedule_type || "daily",
      JSON.stringify(schedule_days || []),
      color || "#4F46E5",
      reminder_time || null,
      target_per_day || 1
    );

  const habit = db.prepare("SELECT * FROM habits WHERE id = ?").get(info.lastInsertRowid);
  res.status(201).json({ ...habit, schedule_days: JSON.parse(habit.schedule_days) });
});

function ownedHabit(req, res) {
  const habit = db.prepare("SELECT * FROM habits WHERE id = ? AND user_id = ?").get(
    req.params.id,
    req.user.id
  );
  if (!habit) res.status(404).json({ error: "habit not found" });
  return habit;
}

router.put("/:id", (req, res) => {
  const habit = ownedHabit(req, res);
  if (!habit) return;
  const b = req.body || {};
  db.prepare(
    `UPDATE habits SET title=?, description=?, schedule_type=?, schedule_days=?, color=?, reminder_time=?, target_per_day=?, archived=? WHERE id=?`
  ).run(
    b.title ?? habit.title,
    b.description ?? habit.description,
    b.schedule_type ?? habit.schedule_type,
    JSON.stringify(b.schedule_days ?? JSON.parse(habit.schedule_days)),
    b.color ?? habit.color,
    b.reminder_time ?? habit.reminder_time,
    b.target_per_day ?? habit.target_per_day,
    b.archived ? 1 : 0,
    habit.id
  );
  res.json({ ...db.prepare("SELECT * FROM habits WHERE id=?").get(habit.id), schedule_days: JSON.parse(habit.schedule_days) });
});

router.delete("/:id", (req, res) => {
  const habit = ownedHabit(req, res);
  if (!habit) return;
  db.prepare("DELETE FROM habits WHERE id = ?").run(habit.id);
  res.json({ deleted: true });
});

module.exports = router;
