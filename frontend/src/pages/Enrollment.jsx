import { useCallback, useEffect, useMemo, useState } from "react";
import { GraduationCap, Search } from "lucide-react";
import api, { getErrorMessage } from "../api/client";
import PageHeader from "../components/PageHeader";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import { SkeletonList } from "../components/Skeleton";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { initials } from "../utils/labels";

// Every student with their class. Change the class right in the row: it saves immediately (with Undo).
export default function Enrollment() {
  const { hasPermission } = useAuth();
  const toast = useToast();
  const canChange = hasPermission("enrollment:UPDATE");
  const canRemove = hasPermission("enrollment:DELETE");

  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [state, setState] = useState("loading");
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [onlyUnenrolled, setOnlyUnenrolled] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setState("loading");
    try {
      const [s, c] = await Promise.all([api.get("/enrollments"), api.get("/classes")]);
      setStudents(s.data.students);
      setClasses(c.data.classes);
      setState("ready");
    } catch (err) {
      setError(getErrorMessage(err, "Could not load students."));
      setState("error");
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch
    load();
  }, [load]);

  async function change(student, value) {
    const previous = student.class?.id || null;
    const next = value ? Number(value) : null;
    if (previous === next) return;
    try {
      if (next) await api.put(`/enrollments/${student.id}`, { classId: next });
      else await api.delete(`/enrollments/${student.id}`);
      await load(true);
      toast.show({
        message: next ? `${student.name} moved` : `${student.name} removed from class`,
        actionLabel: "Undo",
        onAction: async () => {
          try {
            if (previous) await api.put(`/enrollments/${student.id}`, { classId: previous });
            else await api.delete(`/enrollments/${student.id}`);
          } catch (err) {
            toast.error(getErrorMessage(err, "Could not undo."));
          }
          load(true);
        },
      });
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not change the class."));
    }
  }

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return students.filter(
      (s) => (!q || s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)) && (!onlyUnenrolled || !s.class)
    );
  }, [students, query, onlyUnenrolled]);

  const unenrolledCount = students.filter((s) => !s.class).length;

  return (
    <>
      <PageHeader title="Enrollment" description="Add, move or remove students. Each student belongs to one class." />

      {state === "loading" && <SkeletonList rows={6} height={64} />}
      {state === "error" && <ErrorState message={error} onRetry={() => load()} />}

      {state === "ready" && (
        <>
          <div className="roster-controls">
            <div className="roster-search">
              <Search size={16} aria-hidden="true" />
              <input type="search" placeholder="Search students" aria-label="Search students" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <button className={`chip ${onlyUnenrolled ? "chip-on" : ""}`} aria-pressed={onlyUnenrolled} onClick={() => setOnlyUnenrolled((v) => !v)}>
              No class ({unenrolledCount})
            </button>
          </div>

          {students.length === 0 ? (
            <EmptyState
              icon={GraduationCap}
              title="No students yet"
              text="New accounts that register become students. They will show up here to be enrolled."
            />
          ) : shown.length === 0 ? (
            <EmptyState
              icon={GraduationCap}
              title={onlyUnenrolled ? "Everyone has a class" : "No student matches"}
              action={<button className="secondary-button" onClick={() => { setQuery(""); setOnlyUnenrolled(false); }}>Show all</button>}
            />
          ) : (
            <ul className="roster-list">
              {shown.map((s) => (
                <li key={s.id} className="roster-row simple">
                  <div className="avatar" aria-hidden="true">{initials(s.name)}</div>
                  <div className="roster-main">
                    <strong>{s.name}</strong>
                    <span className="roster-meta">{s.email}</span>
                  </div>
                  <select
                    className="select-compact"
                    aria-label={`Class for ${s.name}`}
                    value={s.class?.id || ""}
                    disabled={!canChange}
                    onChange={(e) => change(s, e.target.value)}
                  >
                    <option value="" disabled={!canRemove && !!s.class}>No class</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </>
  );
}