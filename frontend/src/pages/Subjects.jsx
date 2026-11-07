import { School } from "lucide-react";
import PageHeader from "../components/PageHeader";
import ClassPicker from "../components/ClassPicker";
import SubjectsPanel from "../components/SubjectsPanel";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import { SkeletonList } from "../components/Skeleton";
import { useClasses, useSelectedClass } from "../hooks/useClasses";

// Add subjects and assign teachers (this replaces the old teacher-to-student assignment page).
export default function Subjects() {
  const { classes, state, error, reload } = useClasses();
  const [current, select] = useSelectedClass(classes);

  return (
    <>
      <PageHeader title="Subjects" description="Add subjects to a class and assign the teachers who teach them." />

      {state === "loading" && <SkeletonList rows={3} height={96} />}
      {state === "error" && <ErrorState message={error} onRetry={reload} />}
      {state === "ready" && classes.length === 0 && (
        <EmptyState icon={School} title="Create a class first" text="Subjects belong to a class. Add one from the Classes page." />
      )}
      {state === "ready" && current && (
        <>
          <ClassPicker classes={classes} value={current} onChange={select} />
          <SubjectsPanel key={current.id} classId={current.id} />
        </>
      )}
    </>
  );
}