import { NextResponse } from "next/server";

import { deleteSession } from "@/lib/auth/session";

export async function POST() {
  await deleteSession();
  return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_APP_URL!));
}
