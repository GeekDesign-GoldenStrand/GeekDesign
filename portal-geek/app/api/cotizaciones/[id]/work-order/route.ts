import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getFullQuotationContext } from "@/lib/services/cotizaciones";
import { generateWorkOrderPDF } from "@/lib/utils/pdf-work-order";
import {
  DataInconsistencyError,
  NotFoundError,
  ConflictError,
  ForbiddenError,
  UnauthorizedError,
} from "@/lib/utils/errors";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const p = await params;
    const id = parseInt(p.id, 10);

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid quotation ID" }, { status: 400 });
    }

    // 1. Fetch full context (checks existence and 'Aprobada' status)
    const context = await getFullQuotationContext(id);

    // 2. Security validation: Check if client email and folio match exactly (read from cookies first to avoid URL exposure)
    const { searchParams } = new URL(request.url);
    const cookieStore = await cookies();
    const cookieEmail = cookieStore.get("client_email")?.value;
    const cookieFolio = cookieStore.get("client_folio")?.value;
    const queryEmail = searchParams.get("email");
    const headerEmail = request.headers.get("X-Client-Email");
    const email = cookieEmail || queryEmail || headerEmail;

    if (!email || !cookieFolio) {
      throw new UnauthorizedError(
        "Acceso denegado."
      );
    }

    const emailMatch = email.toLowerCase() === context.client.correo_electronico.toLowerCase();
    const folioMatch = 
      cookieFolio.trim().toLowerCase() === context.quotation.folio?.trim().toLowerCase() ||
      cookieFolio.trim() === String(context.quotation.id_cotizacion) ||
      String(id) === String(context.quotation.id_cotizacion) ||
      String(id).toLowerCase() === context.quotation.folio?.toLowerCase();

    if (!emailMatch || !folioMatch) {
      throw new ForbiddenError(
        "Acceso denegado."
      );
    }

    // 3. Generate PDF Stream
    const pdfStream = await generateWorkOrderPDF(context);

    // Convert Node.js stream to Web ReadableStream for Next.js Response
    const stream = new ReadableStream({
      start(controller) {
        pdfStream.on("data", (chunk: any) => controller.enqueue(chunk));
        pdfStream.on("end", () => controller.close());
        pdfStream.on("error", (err: any) => controller.error(err));
      },
    });

    return new NextResponse(stream, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="OT-${id}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error("Error generating Work Order PDF:", error);

    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: "Acceso denegado." }, { status: 404 });
    }

    if (error instanceof ConflictError) {
      return NextResponse.json({ error: "Acceso denegado." }, { status: 409 });
    }

    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Acceso denegado." }, { status: 401 });
    }

    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: "Acceso denegado." }, { status: 403 });
    }

    if (error instanceof DataInconsistencyError) {
      return NextResponse.json(
        { error: "Data Inconsistency", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}

