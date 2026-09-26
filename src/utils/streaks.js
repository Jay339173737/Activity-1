function computeStreaks(dates, todayLocal) {
  const unique = [...new Set(dates)].sort(); // ascending YYYY-MM-DD
  const set = new Set(unique);
  const toKey = (d) => d.toISOString().slice(0, 10);

  const dayMs = 86400000;
  const today = new Date(todayLocal + "T00:00:00Z");

  // Current streak: today counts, or yesterday (grace if today isn't done yet)
  let cursor = new Date(today);
  if (!set.has(toKey(cursor))) cursor = new Date(today.getTime() - dayMs);

  let current = 0;
  while (set.has(toKey(cursor))) {
    current++;
    cursor = new Date(cursor.getTime() - dayMs);
  }

  // Longest streak
  let longest = 0,
    run = 0,
    prev = null;
  for (const d of unique) {
    if (prev) {
      const diff =
        (new Date(d + "T00:00:00Z") - new Date(prev + "T00:00:00Z")) / dayMs;
      run = diff === 1 ? run + 1 : 1;
    } else {
      run = 1;
    }
    longest = Math.max(longest, run);
    prev = d;
  }

  return { current, longest };
}

module.exports = { computeStreaks };
