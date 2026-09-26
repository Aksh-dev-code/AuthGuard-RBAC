import { useEffect, useState } from "react";
import { Calendar, Check, RefreshCw, UserCheck, X } from "lucide-react";
import api, { getErrorMessage } from "../api/client";
import PageHeader from "../components/PageHeader";
import { useAuth } from "../context/AuthContext";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function Attendance() {
  const { user, hasRole, hasPermission } = useAuth();

  const isStudent = hasRole("student");
  const isTeacher = hasRole("teacher");
  const canReadAll = hasPermission("attendance:READ");
  const canMark = hasPermission("attendance:CREATE");

  const [records, setRecords] = useState([]);
  const [myStudents, setMyStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Mark-attendance form state (teachers only)
  const [markForm, setMarkForm] = useState({ studentId: "", date: todayISO(), status: "PRESENT" });
  const [marking, setMarking] = useState(false);

  // Filters (principal / super_admin only)
  const [filterStudentId, setFilterStudentId] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");

  async function loadAttendance() {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (canReadAll) {
        if (filterStudentId) params.studentId = filterStudentId;
        if (filterFrom) params.from = filterFrom;
        if (filterTo) params.to = filterTo;
      }
      const response = await api.get("/attendance", { params });
      const rows = response.data.attendance || response.data.data || response.data;
      setRecords(Array.isArray(rows) ? rows : []);
    } catch (err) {
      setError(getErrorMessage(err, "Could not load attendance."));
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadMyStudents() {
    if (!isTeacher || !user?.id) return;
    try {
      const response = await api.get(`/teachers/${user.id}/students`);
      const rows = response.data.students || response.data.data || response.data;
      setMyStudents(Array.isArray(rows) ? rows : []);
    } catch {
      // A teacher without any manage-level permission on this route is expected
      // to get 403 here if they have no assignments yet - fail quietly.
      setMyStudents([]);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    loadAttendance();
    loadMyStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleMarkSubmit(event) {
    event.preventDefault();
    setError("");

    if (!markForm.studentId || !markForm.date) {
      setError("Select a student and a date.");
      return;
    }

    setMarking(true);
    try {
      await api.post("/attendance", {
        studentId: Number(markForm.studentId),
        date: markForm.date,
        status: markForm.status,
      });
      setSuccess("Attendance recorded.");
      await loadAttendance();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to record attendance."));
    } finally {
      setMarking(false);
    }
  }

  function handleFilterSubmit(event) {
    event.preventDefault();
    loadAttendance();
  }

  function statusBadgeClass(status) {
    if (status === "PRESENT") return "badge badge-success";
    if (status === "ABSENT") return "badge badge-danger";
    return "badge badge-warning";
  }

  return (
    <>
      <PageHeader
        title="Attendance"
        description={
          isStudent
            ? "Your attendance record."
            : isTeacher
            ? "Mark and review attendance for your assigned students."
            : "Attendance across the school."
        }
      />

      {error && <div className="alert error">{error}</div>}
      {success && <div className="alert success">{success}</div>}

      {/* Mark attendance - teachers only */}
      {isTeacher && canMark && (
        <form onSubmit={handleMarkSubmit} className="panel" style={{ marginBottom: 16, padding: 20 }}>
          <h3 style={{ marginTop: 0 }}>
            <UserCheck size={18} className="inline-icon" />
            Mark attendance
          </h3>

          {myStudents.length === 0 ? (
            <p style={{ fontSize: 13, color: "#667085" }}>
              You have no assigned students yet — ask a principal or admin to assign some to you.
            </p>
          ) : (
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
              <div>
                <label>Student</label>
                <select
                  value={markForm.studentId}
                  onChange={(e) => setMarkForm((f) => ({ ...f, studentId: e.target.value }))}
                  style={{ display: "block", padding: "6px 8px", borderRadius: 6, minWidth: 200 }}
                >
                  <option value="">Select student</option>
                  {myStudents.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label>Date</label>
                <div className="input-icon">
                  <Calendar size={16} />
                  <input
                    type="date"
                    value={markForm.date}
                    onChange={(e) => setMarkForm((f) => ({ ...f, date: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label>Status</label>
                <select
                  value={markForm.status}
                  onChange={(e) => setMarkForm((f) => ({ ...f, status: e.target.value }))}
                  style={{ display: "block", padding: "6px 8px", borderRadius: 6 }}
                >
                  <option value="PRESENT">Present</option>
                  <option value="ABSENT">Absent</option>
                  <option value="LATE">Late</option>
                </select>
              </div>

              <button type="submit" className="primary-button" disabled={marking}>
                {marking ? "Saving..." : "Save"}
              </button>
            </div>
          )}
        </form>
      )}

      {/* Filters - principal / super_admin only */}
      {canReadAll && (
        <form onSubmit={handleFilterSubmit} className="toolbar" style={{ flexWrap: "wrap", gap: 10 }}>
          <input
            placeholder="Student ID (optional)"
            value={filterStudentId}
            onChange={(e) => setFilterStudentId(e.target.value)}
            style={{ padding: "6px 8px", borderRadius: 6, maxWidth: 160 }}
          />
          <input
            type="date"
            value={filterFrom}
            onChange={(e) => setFilterFrom(e.target.value)}
            style={{ padding: "6px 8px", borderRadius: 6 }}
          />
          <input
            type="date"
            value={filterTo}
            onChange={(e) => setFilterTo(e.target.value)}
            style={{ padding: "6px 8px", borderRadius: 6 }}
          />
          <button type="submit" className="secondary-button">
            Apply filters
          </button>
          <button type="button" className="secondary-button" onClick={loadAttendance}>
            <RefreshCw size={16} />
            Refresh
          </button>
        </form>
      )}

      <div className="panel table-panel">
        <table>
          <thead>
            <tr>
              {!isStudent && <th>Student</th>}
              <th>Date</th>
              <th>Status</th>
              {!isStudent && <th>Marked by</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="4" className="empty">
                  Loading attendance...
                </td>
              </tr>
            ) : records.length === 0 ? (
              <tr>
                <td colSpan="4" className="empty">
                  No attendance records found.
                </td>
              </tr>
            ) : (
              records.map((record) => (
                <tr key={record.id}>
                  {!isStudent && <td>{record.student?.name || "—"}</td>}
                  <td>{new Date(record.date).toLocaleDateString()}</td>
                  <td>
                    <span className={statusBadgeClass(record.status)}>
                      {record.status === "PRESENT" && <Check size={12} className="inline-icon" />}
                      {record.status === "ABSENT" && <X size={12} className="inline-icon" />}
                      {record.status}
                    </span>
                  </td>
                  {!isStudent && <td>{record.markedBy?.name || "—"}</td>}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}