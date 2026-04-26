import { NextRequest } from "next/server";
import { runLookup } from "@/lib/lookup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: { address?: string; closingDate?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json(
      { ok: false, reason: "validation", message: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const result = await runLookup({
    address: body.address ?? "",
    closingDate: body.closingDate,
  });

  // Always 200 — failures are part of the typed payload, not HTTP errors.
  return Response.json(result);
}
