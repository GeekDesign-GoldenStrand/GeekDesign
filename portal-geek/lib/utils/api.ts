import { NextResponse } from "next/server";

import type { ApiResponse, PaginatedResponse } from "@/types";

// Standard success response helper.
export function ok<T>(data: T): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ data, error: null }, { status: 200 });
}

// Success helper for newly created resources.
export function created<T>(data: T): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ data, error: null }, { status: 201 });
}

// Used for endpoints that intentionally return no body.
export function noContent(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

// Standard error response helper with a configurable status code.
export function apiError(message: string, status = 400): NextResponse<ApiResponse<never>> {
  return NextResponse.json({ data: null, error: message }, { status });
}

// Paginated response shape shared by list endpoints.
export function paginated<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number
): NextResponse<PaginatedResponse<T>> {
  return NextResponse.json({ data: items, total, page, pageSize }, { status: 200 });
}
