import { useState } from "react";
import { Plus, School } from "lucide-react";
import PageHeader from "../components/PageHeader";
import ClassCard from "../components/ClassCard";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import { SkeletonList } from "../components/Skeleton";
import api, { getErrorMessage } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useClasses } from "../hooks/useClasses";

export default function Classes() {
  const { hasPermission } = useAuth();
  const toast = useToast();
  const canCreate = hasPermission("classes:CREATE");
  const { classes, state, error, reload } = useClasses();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function createClass(e) {
    e.preventDefault();
    if (name.trim().length < 2) return toast.error("Enter a class name, e.g. Class Nine.");
    setBusy(true);
    try {
      await api.post("/classes", { name });
      setName("");
      toast.success("Class created");
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not create the class."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader title="Classes" description="Open a class to see its students, subjects, attendance and questions." />

      {canCreate && (
        <form className="inline-form" onSubmit={createClass}>
          <input placeholder="New class, e.g. Class Nine" aria-label="Class name" value={name} onChange={(e) => setName(e.target.value)} />
          <button className="primary-button" type="submit" disabled={busy}>
            <Plus size={16} aria-hidden="true" /> New class
          </button>
        </form>
      )}

      {state === "loading" && <SkeletonList rows={3} height={110} />}
      {state === "error" && <ErrorState message={error} onRetry={reload} />}
      {state === "ready" && classes.length === 0 && (
        <EmptyState
          icon={School}
          title="No classes yet"
          text={canCreate ? "Create your first class above." : "You will see your class here once you are added to one."}
        />
      )}
      {state === "ready" && classes.length > 0 && (
        <div className="class-grid">
          {classes.map((c) => (
            <ClassCard key={c.id} klass={c} />
          ))}
        </div>
      )}
    </>
  );
}