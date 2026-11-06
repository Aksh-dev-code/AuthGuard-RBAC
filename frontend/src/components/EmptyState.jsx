export default function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className="empty-state">
      {Icon && <Icon size={34} aria-hidden="true" />}
      <strong>{title}</strong>
      {text && <p>{text}</p>}
      {action}
    </div>
  );
}