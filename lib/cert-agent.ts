// The Permit Auto-Filler agent.
//
// Input:  a booking row + the inspection findings (pass/fail, system notes).
// Output: structured cert-form fields + an array of escalations (fields the
//         agent wasn't fully confident about and a human should review).
//
// The agent reasons about jurisdiction-specific rules (Form 4-B for GTCHD,
// the BLDHD format for Leelanau, the HDNW portal upload for Antrim) and
// fills a single normalized payload that the PDF renderer maps into the
// county-specific output.
//
// In demo mode (no ANTHROPIC_API_KEY) the agent runs deterministically —
// it composes a sensible baseline payload from the booking data + notes
// without calling the API. This keeps the demo runnable without keys.

import { getAnthropic, isAnthropicLive, CERT_MODEL } from "./anthropic";
import type { Jurisdiction } from "./jurisdictions";

// ─── Public types ─────────────────────────────────────────────────────

export type CertAgentInput = {
  jurisdiction: Jurisdiction;
  property: {
    formattedAddress: string;
    rawAddress: string;
    latitude: number | null;
    longitude: number | null;
    countyFips: string;
    withinSurfaceWater: boolean | null;
  };
  booking: {
    id: string;
    realtorName: string;
    realtorEmail: string | null;
    closingDate: Date | null;
    scheduledFor: Date | null;
  };
  inspector: {
    name: string;
    company: string;
    phone: string | null;
    email: string | null;
  };
  inspection: {
    pass: boolean;
    systemNotes: string;
  };
};

export type CertAgentEscalation = {
  field: string;
  reason: string;
};

export type CertAgentOutput = {
  // Fields shared across all county forms — the PDF renderer maps these
  // into the jurisdiction-specific layout.
  ownerOnTitle: string;        // best-effort from realtor + property
  propertyAddress: string;
  parcelId: string | null;     // null if unknown — escalated
  countyJurisdiction: string;  // GTCHD / BLDHD / HDNW
  formCode: string;
  inspectionDate: string;      // ISO yyyy-mm-dd
  inspectorName: string;
  inspectorCompany: string;
  result: "PASS" | "FAIL" | "PASS_WITH_NOTES";
  resultRationale: string;     // 2-3 sentences in the inspector's voice
  systemAge: string;           // "older than 25 yrs" / "approximately X years" / "unknown"
  systemNotes: string;
  withinSurfaceWaterBuffer: boolean | null;
  recommendedAction: string;   // for FAIL or PASS_WITH_NOTES
  validUntil: string;          // ISO date — derived from inspection date + jurisdiction.evalValidityYears
  preparedBy: string;          // "Traverse, on behalf of [inspector]"
  source: "anthropic" | "demo-stub";
  escalations: CertAgentEscalation[];
};

// ─── Public API ────────────────────────────────────────────────────────

export async function generateCertPayload(
  input: CertAgentInput,
): Promise<CertAgentOutput> {
  if (!isAnthropicLive()) {
    return demoStub(input);
  }
  return callClaude(input);
}

// ─── Demo stub (deterministic) ─────────────────────────────────────────

function demoStub(input: CertAgentInput): CertAgentOutput {
  const inspectionDate = (input.booking.scheduledFor ?? new Date()).toISOString().slice(0, 10);
  const validUntil = addYearsISO(inspectionDate, input.jurisdiction.evalValidityYears);
  const result = input.inspection.pass
    ? input.inspection.systemNotes.length > 0
      ? "PASS_WITH_NOTES"
      : "PASS"
    : "FAIL";

  const rationale = input.inspection.pass
    ? `System functioning safely under the ${input.jurisdiction.authorityShortName} grandfather clause. No effluent on the surface, no backup into the structure, liquid levels at or below outlet invert, and no direct discharge into surface water observed at time of inspection.`
    : `System failed inspection. Specific failure conditions identified: see notes. Replacement or repair to current ${input.jurisdiction.authorityShortName} construction standards is required before transfer can complete.`;

  const recommendedAction = input.inspection.pass
    ? "No corrective action required. Cert valid for 3 years from inspection date."
    : "Replace drain field per attached scope. Estimated cost range $15,000–$35,000 depending on soil conditions. Escrow hold-back recommended at 1.75× repair estimate.";

  // Escalations: fields the demo can't infer without a real Claude call.
  const escalations: CertAgentEscalation[] = [
    {
      field: "parcelId",
      reason:
        "Demo stub cannot resolve the parcel ID from the address alone. Pull from the GT County Tax Parcel Map Viewer or the BLDHD/HDNW portal before submission.",
    },
    {
      field: "systemAge",
      reason:
        "Demo stub could not determine system age. Retrieve the original septic permit from the Environmental Health Digital Records Portal and update before submission.",
    },
  ];

  return {
    ownerOnTitle: `[Owner of record] · ${input.property.formattedAddress}`,
    propertyAddress: input.property.formattedAddress,
    parcelId: null,
    countyJurisdiction: input.jurisdiction.authorityShortName,
    formCode: input.jurisdiction.formCode,
    inspectionDate,
    inspectorName: input.inspector.name,
    inspectorCompany: input.inspector.company,
    result,
    resultRationale: rationale,
    systemAge: "Unknown — pull from EH Digital Records Portal",
    systemNotes: input.inspection.systemNotes || "(no inspector notes provided)",
    withinSurfaceWaterBuffer: input.property.withinSurfaceWater,
    recommendedAction,
    validUntil,
    preparedBy: `Traverse, on behalf of ${input.inspector.name}`,
    source: "demo-stub",
    escalations,
  };
}

// ─── Real Claude call ──────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are the Permit Auto-Filler agent for Traverse — a Northern Michigan custom-software shop.

Your job: take an inspector's findings on a Time-of-Sale (TOS) septic inspection and produce the structured payload a county health authority will accept on its certification form.

You are filling forms for three jurisdictions, each with different rules:

- GTCHD (Grand Traverse, FIPS 26055) — Form 4-B. TOS rule applies only if the property is within 300 ft of surface water. Grandfather clause: a functional older system that doesn't meet current construction standards still PASSES if it's not actively failing. Failure conditions are statutorily defined: sewage backup into the structure, effluent on the ground, structural tank failure, liquid above outlet invert, direct discharge to water.

- BLDHD (Leelanau / Benzie, FIPS 26089) — Universal countywide TOS, no surface-water buffer. Only county sanitarians inspect; private inspectors are not authorized. Same failure-condition standard.

- HDNW (Antrim et al, FIPS 26009) — Mixed model. Online-portal submission. Standard failure conditions.

For every form:
- A passed eval is valid for 3 years from inspection date
- Be conservative: if a field is uncertain, mark it for escalation rather than fabricating a value
- When pass=true but the inspector left notes, return PASS_WITH_NOTES so the human reviewer sees them

Output strict JSON matching the CertAgentOutput TypeScript type. Include an "escalations" array for any field you couldn't resolve confidently.`;

async function callClaude(input: CertAgentInput): Promise<CertAgentOutput> {
  const client = getAnthropic()!;

  const userPayload = {
    jurisdiction: {
      authorityShortName: input.jurisdiction.authorityShortName,
      authorityName: input.jurisdiction.authorityName,
      formCode: input.jurisdiction.formCode,
      formName: input.jurisdiction.formName,
      countyFips: input.jurisdiction.countyFips,
      surfaceWaterRule: input.jurisdiction.surfaceWaterRule,
      evalValidityYears: input.jurisdiction.evalValidityYears,
      inspectorModel: input.jurisdiction.inspectorModel,
    },
    property: input.property,
    booking: {
      id: input.booking.id,
      realtorName: input.booking.realtorName,
      realtorEmail: input.booking.realtorEmail,
      closingDate: input.booking.closingDate?.toISOString() ?? null,
      scheduledFor: input.booking.scheduledFor?.toISOString() ?? null,
    },
    inspector: input.inspector,
    inspection: input.inspection,
  };

  const response = await client.messages.create({
    model: CERT_MODEL,
    max_tokens: 1500,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Inspection input:\n\n${JSON.stringify(userPayload, null, 2)}\n\nReturn a JSON object matching CertAgentOutput. No prose outside the JSON.`,
      },
    ],
  });

  // Pull the first text block
  const text = response.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("\n")
    .trim();

  // Trim possible code fences
  const json = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  const parsed = JSON.parse(json);

  // Stamp the source so the UI can show where the result came from
  return { ...parsed, source: "anthropic" };
}

// ─── Helpers ───────────────────────────────────────────────────────────

function addYearsISO(iso: string, years: number): string {
  const dt = new Date(iso);
  dt.setFullYear(dt.getFullYear() + years);
  return dt.toISOString().slice(0, 10);
}
