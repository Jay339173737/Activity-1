require("dotenv").config();
const express = require("express");

const app = express();
app.use(express.json());

app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/api/auth", require("./routes/auth"));
app.use("/api/habits", require("./routes/habits"));
app.use("/api", require("./routes/completions")); // /habits/:id/complete + /completions
app.use("/api/stats", require("./routes/stats"));

// 404 + error handlers
app.use((req, res) => res.status(404).json({ error: "not found" }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "internal server error" });
});

module.exports = app;
