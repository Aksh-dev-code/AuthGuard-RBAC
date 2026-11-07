import { School } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import AttendanceRoster from "../components/AttendanceRoster";
import StudentHistory from "../components/StudentHistory";
import ClassPicker from "../components/ClassPicker";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import { SkeletonList } from "../components/Skeleton";
import { useAuth } from "../context/AuthContext";
import { useClasses, useSelectedClass } from "../hooks/useClasses";

// Role-adaptive: student = own history | teacher = assigned classes | centre admin / super admin = all classes.
export default function Attendance() {
  const { hasPermission } = useAuth();
  const staff = hasPermission("attendance:READ") || hasPermission("attendance:READ_ASSIGNED");

  if (!staff) {
    return (
      <>
        <PageHeader title="My attendance" description="Your attendance record." />
        <StudentHistory />
      </>
    );
  }
  return <StaffAttendance />;
}

function StaffAttendance() {
  const { classes, state, error, reload } = useClasses();
  const [params] = useSearchParams();
  const [selected, select] = useSelectedClass(classes);

  // /attendance?classId=3 (from the dashboard) wins over the remembered class
  const fromUrl = classes.find((c) => c.id === Number(params.get("classId")));
  const current = fromUrl || selected;

  return (
    <>
      <PageHeader
        title="Attendance"
        description={current ? `${current.name}. Tap a status to save it instantly.` : "Mark attendance for your classes."}
      />

      {state === "loading" && <SkeletonList rows={5} height={72} />}
      {state === "error" && <ErrorState message={error} onRetry={reload} />}

      {state === "ready" && classes.length === 0 && (
        <EmptyState
          icon={School}
          title="No classes yet"
          text="Once a Centre Admin assigns you to a subject, its class appears here."
        />
      )}

      {state === "ready" && current && (
        <>
          <ClassPicker classes={classes} value={current} onChange={select} />
          <AttendanceRoster key={current.id} classId={current.id} />
        </>
      )}
    </>
  );
}