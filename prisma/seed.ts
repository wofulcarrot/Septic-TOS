// Seed the Jurisdiction table from the static map in lib/jurisdictions.ts.
// Inspectors stay in the static map for the Day 2 demo — bookings store
// the inspector display info denormalized.
//
// Run with: npx tsx prisma/seed.ts

import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { JURISDICTIONS } from "../lib/jurisdictions";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("seeding jurisdictions…");
  for (const j of Object.values(JURISDICTIONS)) {
    await prisma.jurisdiction.upsert({
      where: { countyFips: j.countyFips },
      create: {
        countyName: j.countyName,
        countyFips: j.countyFips,
        authorityCode: j.authorityCode,
        authorityName: j.authorityName,
        formName: j.formName,
        feeUSD: j.feeUSD,
        feeIsEstimate: j.feeIsEstimate,
        submissionMethod: j.submissionMethod,
        notes: j.notes,
      },
      update: {
        countyName: j.countyName,
        authorityCode: j.authorityCode,
        authorityName: j.authorityName,
        formName: j.formName,
        feeUSD: j.feeUSD,
        feeIsEstimate: j.feeIsEstimate,
        submissionMethod: j.submissionMethod,
        notes: j.notes,
      },
    });
    console.log(`  ✓ ${j.authorityCode} — ${j.countyName} County`);
  }

  const count = await prisma.jurisdiction.count();
  console.log(`jurisdictions in DB: ${count}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
