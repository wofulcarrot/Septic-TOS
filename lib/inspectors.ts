// Inspector roster — split between two operating models:
//
//   • GT County (GTCHD): a market of third-party "Certified Evaluators"
//     vetted by the county. Realtors pick one; the platform connects them.
//     Real businesses on the GTCHD certified roster (per Northern MI realtor
//     reporting): House Professor, Weatherstone Property Inspections, NP Septic.
//
//   • BLDHD (Leelanau / Benzie): government monopoly — only county
//     sanitarians can perform the evaluation. The "inspector" here is
//     a single pseudo-entity ("BLDHD Sanitarian Office") with a long
//     lead time. The result panel switches to a wait-management UX
//     when the only available "inspector" has isCountyOffice=true.
//
//   • HDNW (Antrim): mixed model — private companies + HDNW review.
//     Demo placeholders for now until we ground-truth.
//
// "earliestAvailable" is expressed as days-from-today so the demo never
// goes stale. Real availability windows arrive in Day 3 with calendar
// integration.

export type Inspector = {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  daysFromToday: number;
  slotLabel: string;
  fipsCovered: string[];
  // True when this "inspector" is actually a county health-department
  // office (BLDHD) — there is no private option in that jurisdiction.
  // The realtor result panel switches to a wait-management UX when this
  // is the only inspector returned.
  isCountyOffice?: boolean;
  // Real, named, on the GTCHD certified roster — vs. demo placeholder.
  isRealRoster?: boolean;
  // Public website (helps realtors verify the credential before booking).
  website?: string;
};

export const INSPECTORS: Inspector[] = [
  // ───── GTCHD (Grand Traverse) — real GTCHD Certified Evaluators ─────
  // Source: Taylor & Janel Brown, "The Well and Septic Inspection Guide
  // Nobody Gives You" — names verified against GTCHD certified roster.
  {
    id: "insp-gt-houseprofessor",
    name: "House Professor",
    company: "House Professor",
    phone: "(231) 668-9119",
    email: "info@houseprofessormi.com",
    website: "https://houseprofessormi.com",
    daysFromToday: 3,
    slotLabel: "8:00 AM",
    fipsCovered: ["26055"],
    isRealRoster: true,
  },
  {
    id: "insp-gt-weatherstone",
    name: "Weatherstone Property Inspections",
    company: "Weatherstone Property Inspections",
    phone: "(231) 944-1700",
    email: "info@weatherstoneinspect.com",
    website: "https://weatherstoneinspect.com",
    daysFromToday: 5,
    slotLabel: "10:30 AM",
    fipsCovered: ["26055"],
    isRealRoster: true,
  },
  {
    id: "insp-gt-npseptic",
    name: "NP Septic",
    company: "NP Septic",
    phone: "(231) 947-9900",
    email: "info@npseptic.com",
    website: "https://npseptic.com",
    daysFromToday: 6,
    slotLabel: "1:00 PM",
    fipsCovered: ["26055"],
    isRealRoster: true,
  },

  // ───── BLDHD (Benzie-Leelanau) — government monopoly ─────
  // No private inspectors permitted. The realtor submits an application
  // and waits for a county sanitarian. Official turnaround is 17 business
  // days; peak season is closer to a month. We surface this as a single
  // "inspector" with isCountyOffice=true so the result UX can switch.
  {
    id: "insp-bldhd-office",
    name: "BLDHD Sanitarian Office",
    company: "Benzie-Leelanau District Health Department",
    phone: "(231) 882-6085",
    email: "bldhd@bldhd.org",
    website: "https://www.bldhd.org",
    // Honest peak-season estimate; production calls the BLDHD scheduling
    // intake to refine this.
    daysFromToday: 22,
    slotLabel: "Queue position assigned",
    fipsCovered: ["26089"],
    isCountyOffice: true,
    isRealRoster: true,
  },

  // ───── HDNW (Antrim) — placeholder until we ground-truth ─────
  // HDNW covers Antrim, Charlevoix, Emmet, Otsego. The article doesn't
  // confirm whether HDNW allows private inspectors. Treat these as demo
  // placeholders; verify before customer-facing release.
  {
    id: "insp-hdnw-bellaire-onsite",
    name: "Bellaire Onsite Septic",
    company: "Bellaire Onsite Septic Services",
    phone: "(231) 533-1100",
    email: "office@bellaireonsite.example.com",
    daysFromToday: 5,
    slotLabel: "9:00 AM",
    fipsCovered: ["26009"],
  },
  {
    id: "insp-hdnw-torch",
    name: "Torch Lake Onsite",
    company: "Torch Lake Onsite, Inc.",
    phone: "(231) 533-2200",
    email: "office@torchlakeonsite.example.com",
    daysFromToday: 7,
    slotLabel: "11:00 AM",
    fipsCovered: ["26009"],
  },
  {
    id: "insp-hdnw-office",
    name: "HDNW Sanitarian Office",
    company: "Health Department of Northwest Michigan",
    phone: "(231) 547-6523",
    email: "info@nwhealth.org",
    website: "https://nwhealth.org",
    daysFromToday: 14,
    slotLabel: "Office review",
    fipsCovered: ["26009"],
    isCountyOffice: true,
    isRealRoster: true,
  },
];

export type InspectorWithSlot = Inspector & {
  earliestAvailable: Date;
  earliestAvailableLabel: string;
};

/**
 * Returns inspectors qualified for the given county FIPS, each with a
 * concrete `earliestAvailable` Date computed from today. Sorted
 * soonest-first.
 */
export function inspectorsForFips(fips: string): InspectorWithSlot[] {
  const today = startOfDay(new Date());
  return INSPECTORS.filter((i) => i.fipsCovered.includes(fips))
    .map((i) => {
      const earliestAvailable = addDays(today, i.daysFromToday);
      return {
        ...i,
        earliestAvailable,
        earliestAvailableLabel: formatSlot(earliestAvailable, i.slotLabel),
      };
    })
    .sort(
      (a, b) =>
        a.earliestAvailable.getTime() - b.earliestAvailable.getTime(),
    );
}

/**
 * Convenience: does this jurisdiction use a county-monopoly model?
 * (true when ALL returned inspectors are county offices.)
 */
export function isCountyMonopoly(fips: string): boolean {
  const list = INSPECTORS.filter((i) => i.fipsCovered.includes(fips));
  return list.length > 0 && list.every((i) => i.isCountyOffice === true);
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function formatSlot(date: Date, slotLabel: string): string {
  const day = date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  return `${day} · ${slotLabel}`;
}
