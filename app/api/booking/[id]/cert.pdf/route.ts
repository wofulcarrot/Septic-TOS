// GET /api/booking/[id]/cert.pdf — re-renders the cert PDF from the stored
// agent payload. Each request regenerates from the JSON snapshot rather
// than reading a cached blob, so layout fixes propagate without re-running
// the agent.

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { renderCertPDF } from "@/lib/cert-pdf";
import type { CertAgentOutput } from "@/lib/cert-agent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const booking = await prisma.booking.findUnique({
    where: { id },
  });
  if (!booking || !booking.certPayloadJson) {
    return Response.json(
      { ok: false, message: "No certificate generated yet for this booking." },
      { status: 404 },
    );
  }

  const payload: CertAgentOutput = JSON.parse(booking.certPayloadJson);
  const pdfBytes = await renderCertPDF(payload);

  const filename = `traverse-cert-${booking.id.slice(-8).toUpperCase()}.pdf`;

  // Convert Uint8Array to a standard Blob so Response can stream it
  // without TypeScript griping at the Buffer overload.
  const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });

  return new Response(blob, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
