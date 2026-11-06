const pad = (n) => String(n).padStart(2, "0");

// Today in the USER'S local timezone (IST on an Indian phone), never UTC.
export function todayLocalISO() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// "2026-09-22" (or an ISO timestamp) -> a local Date at midnight, with no timezone shift.
export function parseISODate(value) {
  const [y, m, d] = String(value).slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function formatDay(value, today = todayLocalISO()) {
  const iso = String(value).slice(0, 10);
  if (iso === today) return "Today";
  const yesterday = parseISODate(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (iso === `${yesterday.getFullYear()}-${pad(yesterday.getMonth() + 1)}-${pad(yesterday.getDate())}`) {
    return "Yesterday";
  }
  return parseISODate(iso).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
}

export function formatTime(value) {
  return new Date(value).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}