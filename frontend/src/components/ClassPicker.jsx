// WhatsApp-style horizontal chips. Hidden when there is only one class (nothing to choose).
export default function ClassPicker({ classes, value, onChange }) {
  if (classes.length < 2) return null;
  return (
    <div className="chip-scroll" role="group" aria-label="Choose a class">
      {classes.map((c) => (
        <button
          key={c.id}
          className={`chip ${value?.id === c.id ? "chip-on" : ""}`}
          aria-pressed={value?.id === c.id}
          onClick={() => onChange(c.id)}
        >
          {c.name}
        </button>
      ))}
    </div>
  );
}