import { School } from "lucide-react";
import PageHeader from "../components/PageHeader";
import ClassPicker from "../components/ClassPicker";
import QuestionsPanel from "../components/QuestionsPanel";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import { SkeletonList } from "../components/Skeleton";
import { useClasses, useSelectedClass } from "../hooks/useClasses";

export default function Questions() {
  const { classes, state, error, reload } = useClasses();
  const [current, select] = useSelectedClass(classes);

  return (
    <>
      <PageHeader title="Questions" description={current ? current.name : "Practice questions for your class."} />

      {state === "loading" && <SkeletonList rows={3} height={92} />}
      {state === "error" && <ErrorState message={error} onRetry={reload} />}
      {state === "ready" && classes.length === 0 && (
        <EmptyState
          icon={School}
          title="No class yet"
          text="You will see questions here once you are added to a class."
        />
      )}
      {state === "ready" && current && (
        <>
          <ClassPicker classes={classes} value={current} onChange={select} />
          <QuestionsPanel key={current.id} classId={current.id} />
        </>
      )}
    </>
  );
}