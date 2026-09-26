require("./config/db"); // initialize database
const app = require("./app");
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`Habit API on http://0.0.0.0:${PORT}`),
);
