import { useCallback, useEffect, useState } from "react";
import { Lock, MessageSquareText, Pencil, Search, Trash2 } from "lucide-react";
import api, { getErrorMessage } from "../api/client";
import { useToast } from "../context/ToastContext";
import { formatDay } from "../utils/dates";
import { SkeletonList } from "./Skeleton";
import EmptyState from "./EmptyState";
import ErrorState from "./ErrorState";
import ConfirmModal from "./ConfirmModal";

// Questions of ONE class. Teachers can add/edit/delete in THEIR subjects; students only read.
export default function QuestionsPanel({ classId }) {
  const toast = useToast();

  const [subjects, setSubjects] = useState([]);
  const [subjectId, setSubjectId] = useState(null); // null = all subjects
  const [search, setSearch] = useState("");
  const [q, setQ] = useState(""); // debounced search
  const [questions, setQuestions] = useState([]);
  const [writable, setWritable] = useState([]); // null = every subject, [] = none (read-only)
  const [state, setState] = useState("loading");
  const [error, setError] = useState("");

  const [draft, setDraft] = useState({ subjectId: "", text: "" });
  const [editing, setEditing] = useState(null); // { id, text }
  const [toDelete, setToDelete] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setQ(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    api
      .get("/subjects", { params: { classId } })
      .then((res) => setSubjects(res.data.subjects))
      .catch(() => setSubjects([]));
  }, [classId]);

  const load = useCallback(async () => {
    setState("loading");
    try {
      const res = await api.get("/questions", { params: { classId, subjectId: subjectId || undefined, q: q || undefined } });
      setQuestions(res.data.questions);
      setWritable(res.data.writableSubjectIds);
      setState("ready");
    } catch (err) {
      setError(getErrorMessage(err, "Could not load questions."));
      setState("error");
    }
  }, [classId, subjectId, q]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch when filters change
    load();
  }, [load]);

  const canWriteIn = (id) => writable === null || (Array.isArray(writable) && writable.includes(id));
  const writableSubjects = subjects.filter((s) => canWriteIn(s.id));
  const readOnly = writableSubjects.length === 0;
  const composerSubject = draft.subjectId || subjectId || writableSubjects[0]?.id || "";

  async function addQuestion(e) {
    e.preventDefault();
    if (draft.text.trim().length < 3) return toast.error("Write the question first (3+ characters).");
    setSaving(true);
    try {
      await api.post("/questions", { subjectId: Number(composerSubject), text: draft.text });
      setDraft({ subjectId: draft.subjectId, text: "" });
      toast.success("Question added");
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not add the question."));
    } finally {
      setSaving(false);
    }
  }

  async function saveEdit(e) {
    e.preventDefault();
    try {
      await api.put(`/questions/${editing.id}`, { text: editing.text });
      setEditing(null);
      toast.success("Question updated");
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not update the question."));
    }
  }

  async function confirmDelete() {
    const item = toDelete;
    setToDelete(null);
    try {
      await api.delete(`/questions/${item.id}`);
      toast.success("Question deleted");
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not delete the question."));
    }
  }

  return (
    <div>
      {readOnly && state === "ready" && (
        <div className="readonly-note"><Lock size={14} aria-hidden="true" /> Read only. Questions are written by your teachers.</div>
      )}

      {!readOnly && (
        <form className="composer" onSubmit={addQuestion}>
          <select
            aria-label="Subject for the new question"
            value={composerSubject}
            onChange={(e) => setDraft({ ...draft, subjectId: Number(e.target.value) })}
          >
            {writableSubjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <textarea
            rows={3}
            placeholder="Type a new question..."
            aria-label="Question text"
            value={draft.text}
            onChange={(e) => setDraft({ ...draft, text: e.target.value })}
          />
          <button className="primary-button" type="submit" disabled={saving}>
            {saving ? "Adding..." : "Add question"}
          </button>
        </form>
      )}

      <div className="chip-scroll" role="group" aria-label="Filter by subject">
        <button className={`chip ${subjectId === null ? "chip-on" : ""}`} onClick={() => setSubjectId(null)}>All</button>
        {subjects.map((s) => (
          <button key={s.id} className={`chip ${subjectId === s.id ? "chip-on" : ""}`} onClick={() => setSubjectId(s.id)}>
            {s.name}
          </button>
        ))}
      </div>

      <div className="roster-search wide">
        <Search size={16} aria-hidden="true" />
        <input type="search" placeholder="Search questions" aria-label="Search questions" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {state === "loading" && <SkeletonList rows={3} height={92} />}
      {state === "error" && <ErrorState message={error} onRetry={load} />}
      {state === "ready" && questions.length === 0 && (
        <EmptyState
          icon={MessageSquareText}
          title={q ? "No question matches your search" : "No questions yet"}
          text={q ? undefined : readOnly ? "Your teachers have not added any questions yet." : "Add the first question above."}
          action={q ? <button className="secondary-button" onClick={() => setSearch("")}>Clear search</button> : null}
        />
      )}

      {state === "ready" && questions.length > 0 && (
        <ul className="card-list">
          {questions.map((item) => (
            <li key={item.id} className="card-row">
              {editing?.id === item.id ? (
                <form className="composer" onSubmit={saveEdit}>
                  <textarea
                    rows={3}
                    aria-label="Edit question"
                    value={editing.text}
                    onChange={(e) => setEditing({ ...editing, text: e.target.value })}
                    autoFocus
                  />
                  <div className="modal-actions">
                    <button type="button" className="secondary-button" onClick={() => setEditing(null)}>Cancel</button>
                    <button type="submit" className="primary-button">Save</button>
                  </div>
                </form>
              ) : (
                <>
                  <p className="question-text">{item.text}</p>
                  <div className="card-row-head">
                    <span className="muted">
                      <span className="tag">{item.subject.name}</span> {item.createdBy.name} · {formatDay(item.createdAt)}
                    </span>
                    {canWriteIn(item.subjectId) && (
                      <div className="row-actions">
                        <button className="icon-btn" aria-label="Edit question" onClick={() => setEditing({ id: item.id, text: item.text })}>
                          <Pencil size={18} />
                        </button>
                        <button className="icon-btn danger" aria-label="Delete question" onClick={() => setToDelete(item)}>
                          <Trash2 size={18} />
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {toDelete && (
        <ConfirmModal
          title="Delete this question?"
          message={toDelete.text.length > 90 ? `${toDelete.text.slice(0, 90)}...` : toDelete.text}
          onConfirm={confirmDelete}
          onCancel={() => setToDelete(null)}
        />
      )}
    </div>
  );
}