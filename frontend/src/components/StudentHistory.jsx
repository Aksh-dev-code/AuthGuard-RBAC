import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarCheck } from "lucide-react";
import api, { getErrorMessage } from "../api/client";
import { formatDay } from "../utils/dates";
import { StatusChip } from "./StatusButtons";
import { SkeletonList } from "./Skeleton";
import EmptyState from "./EmptyState";
import ErrorState from "./ErrorState";

// A student's own attendance (the server only ever returns their own rows).
export default function StudentHistory() {
  const [rows, setRows] = useState([]);
  const [state, setState] = useState("loading");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setState("loading");
    try {
      const res = await api.get("/attendance");
      setRows(res.data.attendance || []);
      setState("ready");
    } catch (err) {
      setError(getErrorMessage(err, "Could not load your attendance."));
      setState("error");
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch
    load();
  }, [load]);

  const totals = useMemo(() => {
    const c = { PRESENT: 0, LATE: 0, ABSENT: 0 };
    rows.forEach((r) => (c[r.status] += 1));
    const total = rows.length;
    return { ...c, total, percent: total ? Math.round(((c.PRESENT + c.LATE) / total) * 100) : null };
  }, [rows]);

  if (state === "loading") return <SkeletonList rows={5} height={56} />;
  if (state === "error") return <ErrorState message={error} onRetry={load} />;
  if (rows.length === 0) {
    return (
      <EmptyState
        icon={CalendarCheck}
        title="No attendance yet"
        text="Your teacher's attendance will show up here."
      />
    );
  }

  return (
    <>
      <div className="summary-bar student-summary">
        <div className="summary-counts">
          <span className="count present">Present <b>{totals.PRESENT}</b></span>
          <span className="count late">Late <b>{totals.LATE}</b></span>
          <span className="count absent">Absent <b>{totals.ABSENT}</b></span>
        </div>
        <strong>{totals.percent}% attendance</strong>
      </div>
      <ul className="history-list">
        {rows.map((r) => (
          <li key={r.id} className="history-row">
            <span>{formatDay(r.date)}</span>
            <StatusChip status={r.status} />
          </li>
        ))}
      </ul>
    </>
  );
}