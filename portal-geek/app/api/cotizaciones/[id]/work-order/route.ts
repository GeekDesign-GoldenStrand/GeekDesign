import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params: _params }: { params: Promise<{ id: string }> }
) {
  return NextResponse.json({ error: "Esta vista está en construcción." }, { status: 404 });
}
