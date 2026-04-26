// Closing-at-risk calculation.
// Compares earliest available inspection slot against the realtor's target
// closing date and returns a buffer-based status used to drive the colored
// callout in the UI.

export type ClosingRisk = {
  level: "safe" | "tight" | "at_risk";
  bufferDays: number;
  closingDate: Date;
  earliestAvailable: Date;
  message: string;
};

export function computeClosingRisk(
  earliestAvailable: Date,
  closingDate: Date,
): ClosingRisk {
  const closing = startOfDay(new Date(closingDate));
  const slot = startOfDay(new Date(earliestAvailable));
  const msPerDay = 1000 * 60 * 60 * 24;
  const bufferDays = Math.floor(
    (closing.getTime() - slot.getTime()) / msPerDay,
  );

  let level: ClosingRisk["level"];
  let message: string;

  if (bufferDays >= 7) {
    level = "safe";
    message = `Closing safe — ${bufferDays} days of buffer between the earliest inspection slot and your closing date.`;
  } else if (bufferDays >= 1) {
    level = "tight";
    message = `Tight — only ${bufferDays} day${bufferDays === 1 ? "" : "s"} of buffer. Book the inspection now to keep this closing on track.`;
  } else if (bufferDays === 0) {
    level = "at_risk";
    message =
      "Same-day risk — the inspection slot is on your closing date. Push the closing or escalate to a same-day inspector.";
  } else {
    level = "at_risk";
    message = `At risk — earliest inspection is ${Math.abs(bufferDays)} day${Math.abs(bufferDays) === 1 ? "" : "s"} after closing. The deadline cannot be met without rescheduling.`;
  }

  return { level, bufferDays, closingDate: closing, earliestAvailable: slot, message };
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
