import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

// Google-Classroom style card: class name, people, and today's attendance at a glance.
export default function ClassCard({ klass, to }) {
  const t = klass.today;
  const marked = t ? t.marked : 0;
  const pct = klass.studentCount ? (marked / klass.studentCount) * 100 : 0;

  return (
    <Link to={to || `/classes/${klass.id}`} className="class-card">
      <div className="class-card-head">
        <strong>{klass.name}</strong>
        <ChevronRight size={18} aria-hidden="true" />
      </div>
      <span className="muted">
        {klass.studentCount} student{klass.studentCount === 1 ? "" : "s"} · {klass.subjectCount} subject{klass.subjectCount === 1 ? "" : "s"}
      </span>
      {t && (
        <div className="class-card-today">
          <div className="progress" aria-hidden="true"><div style={{ width: `${pct}%` }} /></div>
          {klass.studentCount === 0 ? (
            <span className="muted">No students yet</span>
          ) : marked === 0 ? (
            <span className="warn">Today: not marked yet</span>
          ) : (
            <span>
              Today: <b>{t.percent}%</b> present · {marked}/{klass.studentCount} marked
              {t.unmarked > 0 && <span className="warn"> · {t.unmarked} left</span>}
            </span>
          )}
        </div>
      )}
    </Link>
  );
}