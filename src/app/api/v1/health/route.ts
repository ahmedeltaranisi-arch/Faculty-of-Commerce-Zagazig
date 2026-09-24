import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({ data: { status: "ok", service: "commerce-zagazig", timestamp: new Date().toISOString() } });
}
