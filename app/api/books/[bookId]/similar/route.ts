import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.API_BASE_URL;

export async function GET(
  _req: NextRequest,
  { params }: { params: { bookId: string } },
) {
  try {
    const response = await fetch(`${API_BASE}/books/${params.bookId}/similar`);
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
