import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, CheckCircle2, School } from "lucide-react";
import api from "../api/client";
import PageHeader from "../components/PageHeader";
import ClassCard from "../components/ClassCard";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import { SkeletonList } from "../components/Skeleton";
import { useAuth } from "../context/AuthContext";
import { useClasses } from "../hooks/useClasses";
import { formatDay } from "../utils/dates";

export default function Dashboard() {
  const { user, hasPermission } = useAuth();
  const staff = hasPermission("attendance:READ") || hasPermission("attendance:READ_ASSIGNED");
  const firstName = (user?.name || "").split(" ")[0];
  const todayLabel = new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });

  return (
    <>
      <PageHeader title={`Hello${firstName ? `, ${firstName}` : ""}`} description={todayLabel} />
      {staff ? <StaffHome /> : <StudentHome />}
    </>
  );
}

// Teachers and admins: today's attendance per class + the classes still unmarked.
function StaffHome() {
  const { hasPermission } = useAuth();
  const { classes, state, error, reload } = useClasses();

  if (state === "loading") return <SkeletonList rows={3} height={110} />;
  if (state === "error") return <ErrorState message={error} onRetry={reload} />;
  if (classes.length === 0) {
    return (
      <EmptyState
        icon={School}
        title="No classes yet"
        text={hasPermission("classes:CREATE") ? "Create your first class to get started." : "Once a Centre Admin assigns you to a subject, its class appears here."}
        action={hasPermission("classes:CREATE") ? <Link className="primary-button" to="/classes">Go to Classes</Link> : null}
      />
    );
  }

  const needs = classes.filter((c) => c.studentCount > 0 && c.today.unmarked > 0);
  const students = classes.reduce((n, c) => n + c.studentCount, 0);
  const present = classes.reduce((n, c) => n + c.today.present + c.today.late, 0);

  return (
    <>
      {hasPermission("classes:READ") && (
        <div className="stat-row">
          <div className="stat"><span>Classes</span><strong>{classes.length}</strong></div>
          <div className="stat"><span>Students</span><strong>{students}</strong></div>
          <div className="stat"><span>Present today</span><strong>{students ? Math.round((present / students) * 100) : 0}%</strong></div>
        </div>
      )}

      <h2 className="section-title">Needs attention</h2>
      {needs.length === 0 ? (
        <div className="note success"><CheckCircle2 size={18} aria-hidden="true" /> All caught up. Every class is marked for today.</div>
      ) : (
        <ul className="card-list">
          {needs.map((c) => (
            <li key={c.id} className="card-row attention">
              <div>
                <strong>{c.name}</strong>
                <span className="warn"> <AlertCircle size={14} className="inline-icon" aria-hidden="true" />{c.today.unmarked} of {c.studentCount} not marked</span>
              </div>
              <Link className="primary-button" to={`/attendance?classId=${c.id}`}>Mark now</Link>
            </li>
          ))}
        </ul>
      )}

      <h2 className="section-title">Today&apos;s attendance</h2>
      <div className="class-grid">
        {classes.map((c) => (
          <ClassCard key={c.id} klass={c} />
        ))}
      </div>
    </>
  );
}

// Students: their class, subjects and the latest questions.
function StudentHome() {
  const [data, setData] = useState({ state: "loading" });

  useEffect(() => {
    let live = true;
    Promise.all([api.get("/classes"), api.get("/subjects"), api.get("/questions", { params: { limit: 5 } })])
      .then(([c, s, q]) => live && setData({ state: "ready", klass: c.data.classes[0] || null, subjects: s.data.subjects, questions: q.data.questions }))
      .catch(() => live && setData({ state: "error" }));
    return () => {
      live = false;
    };
  }, []);

  if (data.state === "loading") return <SkeletonList rows={3} height={96} />;
  if (data.state === "error") return <ErrorState message="Could not load your page." onRetry={() => window.location.reload()} />;
  if (!data.klass) {
    return (
      <EmptyState
        icon={School}
        title="You are not in a class yet"
        text="Ask your Centre Admin to enrol you. Your class, subjects and questions will appear here."
      />
    );
  }

  return (
    <>
      <h2 className="section-title">My class</h2>
      <div className="class-grid"><ClassCard klass={data.klass} /></div>

      <h2 className="section-title">Subjects</h2>
      <div className="chip-row">
        {data.subjects.map((s) => (
          <Link key={s.id} className="tag big" to={`/classes/${data.klass.id}?tab=questions`}>{s.name}</Link>
        ))}
      </div>

      <h2 className="section-title">Latest questions</h2>
      {data.questions.length === 0 ? (
        <p className="muted">No questions yet.</p>
      ) : (
        <ul className="card-list">
          {data.questions.map((q) => (
            <li key={q.id} className="card-row">
              <p className="question-text">{q.text}</p>
              <span className="muted"><span className="tag">{q.subject.name}</span> {formatDay(q.createdAt)}</span>
            </li>
          ))}
        </ul>
      )}
      <Link className="secondary-button" to="/questions">See all questions</Link>
    </>
  );
}