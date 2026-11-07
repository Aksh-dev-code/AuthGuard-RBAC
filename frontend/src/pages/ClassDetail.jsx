import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import api, { getErrorMessage } from "../api/client";
import PageHeader from "../components/PageHeader";
import ClassStudentsPanel from "../components/ClassStudentsPanel";
import SubjectsPanel from "../components/SubjectsPanel";
import AttendanceRoster from "../components/AttendanceRoster";
import StudentHistory from "../components/StudentHistory";
import QuestionsPanel from "../components/QuestionsPanel";
import ConfirmModal from "../components/ConfirmModal";
import ErrorState from "../components/ErrorState";
import { Skeleton } from "../components/Skeleton";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function ClassDetail() {
  const { classId } = useParams();
  const id = Number(classId);
  const navigate = useNavigate();
  const toast = useToast();
  const { hasPermission } = useAuth();
  const [params, setParams] = useSearchParams();

  const [klass, setKlass] = useState(null);
  const [state, setState] = useState("loading");
  const [error, setError] = useState({ message: "", denied: false });
  const [renaming, setRenaming] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isStaff = hasPermission("classes:READ") || hasPermission("classes:READ_ASSIGNED");
  const canUpdate = hasPermission("classes:UPDATE");
  const canDelete = hasPermission("classes:DELETE");

  const load = useCallback(async () => {
    setState("loading");
    try {
      const res = await api.get(`/classes/${id}`);
      setKlass(res.data.class);
      setState("ready");
    } catch (err) {
      const status = err.response?.status;
      setError({
        denied: status === 403 || status === 404,
        message:
          status === 403 || status === 404
            ? "You don't have access to this class."
            : getErrorMessage(err, "Could not load the class."),
      });
      setState("error");
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch when the class changes
    load();
  }, [load]);

  const tabs = [
    { key: "students", label: "Students", show: isStaff },
    { key: "subjects", label: "Subjects", show: true },
    { key: "attendance", label: "Attendance", show: isStaff || hasPermission("attendance:READ_OWN") },
    { key: "questions", label: "Questions", show: true },
  ].filter((t) => t.show);

  const requested = params.get("tab");
  const tab = tabs.find((t) => t.key === requested)?.key || (isStaff ? "attendance" : "questions");

  async function saveRename(e) {
    e.preventDefault();
    try {
      await api.put(`/classes/${id}`, { name: renaming });
      setRenaming(null);
      toast.success("Class renamed");
      load();
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not rename the class."));
    }
  }

  async function remove() {
    setConfirmDelete(false);
    try {
      await api.delete(`/classes/${id}`);
      toast.success("Class deleted");
      navigate("/classes", { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not delete the class."));
    }
  }

  if (state === "loading") return <Skeleton height={120} />;
  if (state === "error") {
    return (
      <>
        <Link to="/classes" className="back-link"><ArrowLeft size={16} /> Classes</Link>
        <ErrorState message={error.message} onRetry={error.denied ? undefined : load} />
      </>
    );
  }

  return (
    <>
      <Link to="/classes" className="back-link"><ArrowLeft size={16} aria-hidden="true" /> Classes</Link>

      {renaming !== null ? (
        <form className="inline-form" onSubmit={saveRename}>
          <input aria-label="Class name" value={renaming} onChange={(e) => setRenaming(e.target.value)} autoFocus />
          <button className="primary-button" type="submit">Save</button>
          <button className="secondary-button" type="button" onClick={() => setRenaming(null)}>Cancel</button>
        </form>
      ) : (
        <PageHeader
          title={klass.name}
          description={`${klass.studentCount} students · ${klass.subjectCount} subjects`}
          action={
            (canUpdate || canDelete) && (
              <div className="row-actions">
                {canUpdate && (
                  <button className="icon-btn" aria-label="Rename class" onClick={() => setRenaming(klass.name)}>
                    <Pencil size={18} />
                  </button>
                )}
                {canDelete && (
                  <button className="icon-btn danger" aria-label="Delete class" onClick={() => setConfirmDelete(true)}>
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            )
          }
        />
      )}

      <div className="tabs" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            className={`tab ${tab === t.key ? "active" : ""}`}
            onClick={() => setParams({ tab: t.key }, { replace: true })}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="tab-panel">
        {tab === "students" && <ClassStudentsPanel classId={id} />}
        {tab === "subjects" && <SubjectsPanel classId={id} />}
        {tab === "attendance" && (isStaff ? <AttendanceRoster classId={id} /> : <StudentHistory />)}
        {tab === "questions" && <QuestionsPanel classId={id} />}
      </div>

      {confirmDelete && (
        <ConfirmModal
          title={`Delete ${klass.name}?`}
          message="Its subjects, questions and enrolments will be removed. Past attendance is kept. This cannot be undone."
          onConfirm={remove}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </>
  );
}