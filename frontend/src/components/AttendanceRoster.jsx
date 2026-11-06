import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, CheckCheck, Search, Users } from "lucide-react";
import api, { getErrorMessage } from "../api/client";
import { useToast } from "../context/ToastContext";
import { formatDay, formatTime, todayLocalISO } from "../utils/dates";
import { initials } from "../utils/labels";
import StatusButtons, { StatusChip } from "./StatusButtons";
import { SkeletonList } from "./Skeleton";
import EmptyState from "./EmptyState";
import ErrorState from "./ErrorState";

// One class, one day. Date defaults to TODAY (local time) - nothing to pick, no student dropdown.
export default function AttendanceRoster({ classId }) {
  const toast = useToast();
  const today = todayLocalISO();

  const [date, setDate] = useState(today);
  const [data, setData] = useState(null); // { class, canMark, students }
  const [state, setState] = useState("loading"); // loading | ready | error
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [onlyUnmarked, setOnlyUnmarked] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);

  const loadId = useRef(0);
  const seq = useRef({}); // per-student request counter: only the LATEST tap may revert the row

  const load = useCallback(
    async (silent = false) => {
      const id = ++loadId.current;
      if (!silent) setState("loading");
      try {
        const res = await api.get("/attendance/roster", { params: { classId, date } });
        if (id !== loadId.current) return; // a newer request superseded this one
        setData(res.data);
        setState("ready");
      } catch (err) {
        if (id !== loadId.current) return;
        setError(getErrorMessage(err, "Could not load the class."));
        setState("error");
      }
    },
    [classId, date]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch when class/date changes
    load();
  }, [load]);

  const setRecord = (studentId, record) =>
    setData((d) => ({
      ...d,
      students: d.students.map((s) => (s.id === studentId ? { ...s, record } : s)),
    }));

  async function save(student, status) {
    const prev = student.record;
    const n = (seq.current[student.id] = (seq.current[student.id] || 0) + 1);
    const latest = () => seq.current[student.id] === n;

    if (prev?.status === status) {
      // tapping the active status clears it, with Undo
      setRecord(student.id, null);
      try {
        await api.delete("/attendance", { params: { studentId: student.id, date } });
        toast.show({
          message: `${student.name}: cleared`,
          actionLabel: "Undo",
          onAction: () => save({ ...student, record: null }, prev.status),
        });
      } catch (err) {
        if (latest()) setRecord(student.id, prev);
        toast.error(getErrorMessage(err, "Could not clear. Reverted."));
      }
      return;
    }

    setRecord(student.id, { status, markedBy: { name: "You" }, markedAt: new Date().toISOString() });
    try {
      const res = await api.post("/attendance", { studentId: student.id, date, status });
      if (latest()) setRecord(student.id, res.data.record);
    } catch (err) {
      if (latest()) setRecord(student.id, prev);
      toast.error(getErrorMessage(err, `Could not save ${student.name}. Reverted.`));
    }
  }

  async function markAllPresent() {
    const snapshot = data.students;
    const targets = snapshot.filter((s) => !s.record).map((s) => s.id);
    if (!targets.length) return;
    setBulkBusy(true);
    setData((d) => ({
      ...d,
      students: d.students.map((s) =>
        s.record ? s : { ...s, record: { status: "PRESENT", markedBy: { name: "You" }, markedAt: new Date().toISOString() } }
      ),
    }));
    try {
      const res = await api.post("/attendance/bulk", { classId, date, status: "PRESENT" });
      const created = res.data.studentIds;
      await load(true);
      toast.show({
        message: `${created.length} marked present`,
        actionLabel: "Undo",
        onAction: async () => {
          try {
            await api.delete("/attendance/bulk", { data: { classId, date, studentIds: created } });
            await load(true);
          } catch (err) {
            toast.error(getErrorMessage(err, "Could not undo."));
          }
        },
      });
    } catch (err) {
      setData((d) => ({ ...d, students: snapshot }));
      toast.error(getErrorMessage(err, "Could not mark everyone. Reverted."));
    } finally {
      setBulkBusy(false);
    }
  }

  const summary = useMemo(() => {
    const list = data?.students || [];
    const count = (s) => list.filter((x) => x.record?.status === s).length;
    const present = count("PRESENT");
    const late = count("LATE");
    const absent = count("ABSENT");
    return { total: list.length, present, late, absent, unmarked: list.length - present - late - absent };
  }, [data]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data?.students || []).filter(
      (s) => (!q || s.name.toLowerCase().includes(q)) && (!onlyUnmarked || !s.record)
    );
  }, [data, query, onlyUnmarked]);

  const marked = summary.total - summary.unmarked;
  const canMark = !!data?.canMark;

  return (
    <div className="roster">
      <div className="roster-controls">
        <label className="chip date-chip" title="Change the day (past days only)">
          <CalendarDays size={16} aria-hidden="true" />
          <span>{formatDay(date, today)}</span>
          <input
            type="date"
            value={date}
            max={today}
            aria-label="Attendance date"
            onClick={(e) => e.target.showPicker?.()}
            onChange={(e) => e.target.value && setDate(e.target.value)}
          />
        </label>
        {date !== today && (
          <button className="chip" onClick={() => setDate(today)}>
            Back to today
          </button>
        )}

        <div className="roster-search">
          <Search size={16} aria-hidden="true" />
          <input
            type="search"
            placeholder="Search students"
            aria-label="Search students"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {state === "loading" && <SkeletonList rows={6} height={72} />}
      {state === "error" && <ErrorState message={error} onRetry={() => load()} />}

      {state === "ready" && (
        <>
          <div className="summary-bar" aria-label="Attendance summary">
            <div className="summary-counts">
              <span className="count present">Present <b>{summary.present}</b></span>
              <span className="count late">Late <b>{summary.late}</b></span>
              <span className="count absent">Absent <b>{summary.absent}</b></span>
              <span className="count none">Unmarked <b>{summary.unmarked}</b></span>
            </div>
            <div className="summary-progress">
              <div className="progress" aria-hidden="true">
                <div style={{ width: `${summary.total ? (marked / summary.total) * 100 : 0}%` }} />
              </div>
              <strong>{marked}/{summary.total} marked</strong>
            </div>
            <div className="summary-actions">
              {canMark && (
                <button
                  className="primary-button"
                  onClick={markAllPresent}
                  disabled={bulkBusy || summary.unmarked === 0}
                >
                  <CheckCheck size={16} aria-hidden="true" /> Mark all present
                </button>
              )}
              <button
                className={`chip ${onlyUnmarked ? "chip-on" : ""}`}
                aria-pressed={onlyUnmarked}
                onClick={() => setOnlyUnmarked((v) => !v)}
              >
                Unmarked only
              </button>
            </div>
          </div>

          {summary.total === 0 ? (
            <EmptyState
              icon={Users}
              title="No students in this class yet"
              text="Students appear here once they are enrolled."
            />
          ) : visible.length === 0 ? (
            <EmptyState
              icon={CheckCheck}
              title={onlyUnmarked && !query ? "Everyone is marked" : "No student matches"}
              action={
                <button className="secondary-button" onClick={() => { setQuery(""); setOnlyUnmarked(false); }}>
                  Show all students
                </button>
              }
            />
          ) : (
            <ul className="roster-list">
              {visible.map((s) => (
                <li key={s.id} className="roster-row">
                  <div className="avatar" aria-hidden="true">{initials(s.name)}</div>
                  <div className="roster-main">
                    <strong>{s.name}</strong>
                    <span className="roster-meta">
                      {s.record
                        ? `${s.record.markedBy?.name || "Unknown"} · ${formatTime(s.record.markedAt)}`
                        : "Not marked"}
                    </span>
                  </div>
                  {canMark ? (
                    <StatusButtons name={s.name} value={s.record?.status} onChange={(st) => save(s, st)} />
                  ) : (
                    <div className="roster-readonly"><StatusChip status={s.record?.status} /></div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}