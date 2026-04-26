// Maps the booking.status string into a color-coded pill with a friendly label.

const COPPER = "#E07A2F";

type Tone = "draft" | "active" | "in_progress" | "complete" | "warn" | "fail";

const STATUS_MAP: Record<string, { label: string; tone: Tone }> = {
  draft: { label: "Draft", tone: "draft" },
  pending_payment: { label: "Awaiting payment", tone: "warn" },
  booked: { label: "Booked", tone: "active" },
  en_route: { label: "Inspector en route", tone: "in_progress" },
  arrived: { label: "Inspector on site", tone: "in_progress" },
  inspected_pass: { label: "Inspection passed", tone: "complete" },
  inspected_fail: { label: "Inspection failed", tone: "fail" },
  certified: { label: "Certificate ready", tone: "active" },
  submitted: { label: "Submitted to county", tone: "in_progress" },
  accepted: { label: "Closing-clear", tone: "complete" },
};

const TONE_STYLES: Record<Tone, { fg: string; bg: string; border: string }> = {
  draft:       { fg: "#cbd5e1", bg: "rgba(203,213,225,0.06)", border: "rgba(203,213,225,0.18)" },
  active:      { fg: COPPER,    bg: "rgba(224,122,47,0.10)",  border: "rgba(224,122,47,0.30)" },
  in_progress: { fg: "#fde68a", bg: "rgba(234,179,8,0.08)",   border: "rgba(234,179,8,0.30)" },
  complete:    { fg: "#86efac", bg: "rgba(34,197,94,0.07)",   border: "rgba(34,197,94,0.28)" },
  warn:        { fg: "#fdba74", bg: "rgba(234,88,12,0.08)",   border: "rgba(234,88,12,0.30)" },
  fail:        { fg: "#fca5a5", bg: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.30)" },
};

export function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_MAP[status] ?? { label: status, tone: "draft" as Tone };
  const t = TONE_STYLES[meta.tone];
  return (
    <span
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold tracking-wide uppercase"
      style={{
        color: t.fg,
        background: t.bg,
        border: `1px solid ${t.border}`,
        fontFamily: "var(--font-space-grotesk)",
        letterSpacing: "1.5px",
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: t.fg, boxShadow: `0 0 8px ${t.fg}` }}
      />
      {meta.label}
    </span>
  );
}
