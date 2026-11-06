import { Check, Clock, X } from "lucide-react";

const STATUS_META = {
  PRESENT: { label: "Present", icon: Check, className: "present" },
  LATE: { label: "Late", icon: Clock, className: "late" },
  ABSENT: { label: "Absent", icon: X, className: "absent" },
};

// Colour AND icon AND text, so it never relies on colour alone.
export function StatusChip({ status }) {
  const meta = STATUS_META[status];
  if (!meta) return <span className="status-chip none">Not marked</span>;
  const Icon = meta.icon;
  return (
    <span className={`status-chip ${meta.className}`}>
      <Icon size={14} aria-hidden="true" /> {meta.label}
    </span>
  );
}

// Present | Late | Absent. One tap saves; tapping the active one clears it.
export default function StatusButtons({ value, onChange, name }) {
  return (
    <div className="status-group" role="group" aria-label={`Attendance for ${name}`}>
      {Object.entries(STATUS_META).map(([key, meta]) => {
        const Icon = meta.icon;
        const active = value === key;
        return (
          <button
            key={key}
            type="button"
            className={`status-btn ${meta.className} ${active ? "active" : ""}`}
            aria-pressed={active}
            onClick={() => onChange(key)}
          >
            <Icon size={16} aria-hidden="true" />
            <span>{meta.label}</span>
          </button>
        );
      })}
    </div>
  );
}