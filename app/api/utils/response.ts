import { NextResponse } from "next/server";

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json({ data, success: true }, { status });
}

export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message, success: false }, { status });
}

export function paginatedResponse<T>(
  data: T[],
  hasMore: boolean,
  cursor?: string,
  total?: number,
) {
  return NextResponse.json({
    data,
    pagination: {
      hasMore,
      cursor,
      total,
    },
    success: true,
  });
}
