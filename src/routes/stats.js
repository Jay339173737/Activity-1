const express = require("express");
const db = require("../config/db");
const { authRequired } = require("../middleware/auth");
const { computeStreaks } = require("../utils/streaks");

const router = express.Router();
router.use(authRequired);

// GET /api/stats?today=YYYY-MM-DD  -> streaks + 30-day completion rate per habit
router.get("/", (req, res) => {
  const today = req.query.today; // client sends its local date — server never guesses
  if (!/^\d{4}-\d{2}-\d{2}$/.test(today || ""))
    return res.status(400).json({ error: "today query param required (YYYY-MM-DD)" });

  const habits = db.prepare("SELECT * FROM habits WHERE user_id = ? AND archived = 0").all(req.user.id);
  const result = habits.map((h) => {
    const dates = db
      .prepare("SELECT date FROM completions WHERE habit_id = ?")
      .all(h.id)
      .map((r) => r.date);

    const thirtyAgo = new Date(today + "T00:00:00Z");
    thirtyAgo.setUTCDate(thirtyAgo.getUTCDate() - 29);
    const cutoff = thirtyAgo.toISOString().slice(0, 10);
    const recent = dates.filter((d) => d >= cutoff).length;

    return {
      habit_id: h.id,
      title: h.title,
      ...computeStreaks(dates, today),
      completed_last_30_days: recent,
      rate_last_30_days: Math.round((recent / 30) * 100),
    };
  });
  res.json(result);
});

module.exports = router;
