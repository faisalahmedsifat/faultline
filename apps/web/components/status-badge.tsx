export function StatusBadge({ status }: { status: "open" | "ignored" | "resolved" }) {
  return <span className={`badge badge-${status}`}>{status}</span>
}
