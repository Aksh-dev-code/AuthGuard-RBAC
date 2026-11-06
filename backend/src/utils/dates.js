// Attendance dates are stored as plain calendar dates (Postgres DATE).
// "Today" is computed in the centre's timezone (default IST = UTC+5:30),
// NOT in UTC, so marking attendance at 7 AM IST never lands on "yesterday".
const TZ_OFFSET_MINUTES = Number(process.env.APP_TZ_OFFSET_MINUTES ?? 330);

exports.todayISO = () =>
    new Date(Date.now() + TZ_OFFSET_MINUTES * 60000).toISOString().slice(0, 10);

exports.isISODate = (value) =>
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(new Date(`${value}T00:00:00.000Z`).getTime());

exports.toDate = (iso) => new Date(`${iso}T00:00:00.000Z`);