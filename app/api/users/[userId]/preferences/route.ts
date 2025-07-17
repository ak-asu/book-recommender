import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.API_BASE_URL;

export async function GET(
  _req: NextRequest,
  { params }: { params: { userId: string } },
) {
  try {
    const response = await fetch(
      `${API_BASE}/users/${params.userId}/preferences`,
    );
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { userId: string } },
) {
  try {
    const body = await req.json();
    const response = await fetch(
      `${API_BASE}/users/${params.userId}/preferences`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
