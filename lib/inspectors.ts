// Stub inspector roster — 3 per jurisdiction with hard-coded "earliest available"
// slots that are always relative to *today* so the demo never goes stale.
//
// Day 2 replaces this with real availability windows + Stripe-backed slot holds.

export type Inspector = {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  // earliestAvailable is expressed as days-from-today so the demo
  // always returns "near-future" slots regardless of when it runs.
  daysFromToday: number;
  // Time slot label to make the demo feel real ("Tue 8:00 AM" etc.)
  slotLabel: string;
  // Counties (FIPS) this inspector is certified to work in.
  fipsCovered: string[];
};

export const INSPECTORS: Inspector[] = [
  // ───── GTCHD (Grand Traverse) — 3 inspectors ─────
  {
    id: "insp-gt-01",
    name: "Doug Reinhardt",
    company: "Septic & Well Pro",
    phone: "(231) 555-0184",
    email: "doug@septicwellpro.com",
    daysFromToday: 3,
    slotLabel: "8:00 AM",
    fipsCovered: ["26055", "26089"],
  },
  {
    id: "insp-gt-02",
    name: "Maria Voss",
    company: "Bayshore Septic Co.",
    phone: "(231) 555-0291",
    email: "maria@bayshoresepticco.com",
    daysFromToday: 5,
    slotLabel: "10:30 AM",
    fipsCovered: ["26055"],
  },
  {
    id: "insp-gt-03",
    name: "Tom Korski",
    company: "Northern Onsite",
    phone: "(231) 555-0388",
    email: "tom@northernonsite.com",
    daysFromToday: 6,
    slotLabel: "1:00 PM",
    fipsCovered: ["26055", "26009"],
  },

  // ───── BLDHD (Leelanau) — 3 inspectors ─────
  {
    id: "insp-ll-01",
    name: "Wes McAllister",
    company: "Leelanau Onsite Services",
    phone: "(231) 555-0412",
    email: "wes@leelanauonsite.com",
    daysFromToday: 2,
    slotLabel: "9:00 AM",
    fipsCovered: ["26089"],
  },
  {
    id: "insp-ll-02",
    name: "Dana Rourke",
    company: "Suttons Bay Septic",
    phone: "(231) 555-0529",
    email: "dana@suttonsbayseptic.com",
    daysFromToday: 4,
    slotLabel: "11:00 AM",
    fipsCovered: ["26089", "26055"],
  },
  {
    id: "insp-ll-03",
    name: "Frank Petrov",
    company: "Empire Pumping & Inspections",
    phone: "(231) 555-0610",
    email: "frank@empirepumping.com",
    daysFromToday: 7,
    slotLabel: "3:00 PM",
    fipsCovered: ["26089"],
  },

  // ───── HDNW (Antrim) — 3 inspectors ─────
  {
    id: "insp-an-01",
    name: "Carl Hagerty",
    company: "Hagerty Septic Service",
    phone: "(231) 555-0701",
    email: "carl@hagertyseptic.com",
    daysFromToday: 4,
    slotLabel: "8:30 AM",
    fipsCovered: ["26009"],
  },
  {
    id: "insp-an-02",
    name: "Lisa Brouwer",
    company: "Bellaire Pumping",
    phone: "(231) 555-0815",
    email: "lisa@bellairepumping.com",
    daysFromToday: 6,
    slotLabel: "10:00 AM",
    fipsCovered: ["26009", "26055"],
  },
  {
    id: "insp-an-03",
    name: "Ryan Kostanecki",
    company: "Torch Lake Onsite",
    phone: "(231) 555-0944",
    email: "ryan@torchlakeonsite.com",
    daysFromToday: 8,
    slotLabel: "12:30 PM",
    fipsCovered: ["26009"],
  },
];

export type InspectorWithSlot = Inspector & {
  earliestAvailable: Date;
  earliestAvailableLabel: string;
};

/**
 * Returns 2-3 inspectors qualified for the given county FIPS,
 * each with a concrete `earliestAvailable` Date computed from today.
 * Sorted soonest-first so the realtor sees the best options at the top.
 */
export function inspectorsForFips(fips: string): InspectorWithSlot[] {
  const today = startOfDay(new Date());
  return INSPECTORS.filter((i) => i.fipsCovered.includes(fips))
    .map((i) => {
      const earliestAvailable = addDays(today, i.daysFromToday);
      return {
        ...i,
        earliestAvailable,
        earliestAvailableLabel: formatSlot(
          earliestAvailable,
          i.slotLabel,
        ),
      };
    })
    .sort(
      (a, b) =>
        a.earliestAvailable.getTime() - b.earliestAvailable.getTime(),
    );
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
