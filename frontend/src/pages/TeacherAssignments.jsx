import { useEffect, useState } from "react";
import { RefreshCw, Trash2, UserPlus } from "lucide-react";
import api, { getErrorMessage } from "../api/client";
import PageHeader from "../components/PageHeader";

export default function TeacherAssignments() {
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [assignedStudents, setAssignedStudents] = useState([]);

  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadPeople() {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/users");
      const rows = response.data.users || response.data.data || response.data;
      const allUsers = Array.isArray(rows) ? rows : [];
      setTeachers(allUsers.filter((u) => (u.roles || []).some((r) => r.name === "teacher")));
      setStudents(allUsers.filter((u) => (u.roles || []).some((r) => r.name === "student")));
    } catch (err) {
      setError(getErrorMessage(err, "Could not load users."));
    } finally {
      setLoading(false);
    }
  }

  async function loadAssignedStudents(teacherId) {
    if (!teacherId) {
      setAssignedStudents([]);
      return;
    }
    try {
      const response = await api.get(`/teachers/${teacherId}/students`);
      const rows = response.data.students || response.data.data || response.data;
      setAssignedStudents(Array.isArray(rows) ? rows : []);
    } catch (err) {
      setError(getErrorMessage(err, "Could not load this teacher's students."));
      setAssignedStudents([]);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    loadPeople();
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- refetch when the selected teacher changes
    loadAssignedStudents(selectedTeacherId);
  }, [selectedTeacherId]);

  async function handleAssign() {
    if (!selectedTeacherId || !selectedStudentId) return;
    setError("");
    setAssigning(true);
    try {
      await api.post(`/teachers/${selectedTeacherId}/students`, {
        studentId: Number(selectedStudentId),
      });
      setSuccess("Student assigned.");
      setSelectedStudentId("");
      await loadAssignedStudents(selectedTeacherId);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to assign student."));
    } finally {
      setAssigning(false);
    }
  }

  async function handleRemove(studentId) {
    setError("");
    try {
      await api.delete(`/teachers/${selectedTeacherId}/students/${studentId}`);
      setSuccess("Student removed.");
      await loadAssignedStudents(selectedTeacherId);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to remove student."));
    }
  }

  const unassignedStudents = students.filter(
    (s) => !assignedStudents.some((a) => a.id === s.id)
  );

  return (
    <>
      <PageHeader
        title="Teacher Assignments"
        description="Assign students to teachers so teachers can mark and view their attendance."
      />

      {error && <div className="alert error">{error}</div>}
      {success && <div className="alert success">{success}</div>}

      <div className="panel" style={{ padding: 20, marginBottom: 16 }}>
        <label>Teacher</label>
        <select
          value={selectedTeacherId}
          onChange={(e) => setSelectedTeacherId(e.target.value)}
          style={{ display: "block", padding: "6px 8px", borderRadius: 6, minWidth: 260, marginTop: 6 }}
        >
          <option value="">Select a teacher</option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} ({t.email})
            </option>
          ))}
        </select>
      </div>

      {selectedTeacherId && (
        <div className="panel" style={{ padding: 20 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-end", marginBottom: 16, flexWrap: "wrap" }}>
            <div>
              <label>Add a student</label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                style={{ display: "block", padding: "6px 8px", borderRadius: 6, minWidth: 240, marginTop: 6 }}
              >
                <option value="">Select student</option>
                {unassignedStudents.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.email})
                  </option>
                ))}
              </select>
            </div>
            <button className="primary-button" onClick={handleAssign} disabled={!selectedStudentId || assigning}>
              <UserPlus size={16} />
              {assigning ? "Assigning..." : "Assign"}
            </button>
            <button className="secondary-button" onClick={() => loadAssignedStudents(selectedTeacherId)}>
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>

          <table>
            <thead>
              <tr>
                <th>Assigned student</th>
                <th>Email</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {assignedStudents.length === 0 ? (
                <tr>
                  <td colSpan="3" className="empty">
                    No students assigned to this teacher yet.
                  </td>
                </tr>
              ) : (
                assignedStudents.map((s) => (
                  <tr key={s.id}>
                    <td>{s.name}</td>
                    <td>{s.email}</td>
                    <td>
                      <button className="icon-button" onClick={() => handleRemove(s.id)}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {loading && <p style={{ fontSize: 13, color: "#667085", marginTop: 10 }}>Loading users...</p>}
    </>
  );
}