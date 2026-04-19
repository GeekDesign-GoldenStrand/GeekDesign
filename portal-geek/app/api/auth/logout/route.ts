import { NextResponse } from "next/server";

import { SESSION_COOKIE } from "@/lib/auth/session";

export async function POST() {
  const response = NextResponse.json({ data: null, error: null }, { status: 200 });
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
