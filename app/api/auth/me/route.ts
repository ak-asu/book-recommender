import { NextResponse } from "next/server";

const API_BASE = process.env.API_BASE_URL;

export async function GET() {
  try {
    const response = await fetch(`${API_BASE}/auth/me`);
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
