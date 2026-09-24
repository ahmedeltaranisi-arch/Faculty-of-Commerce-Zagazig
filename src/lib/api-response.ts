import { NextResponse } from "next/server";

export function requestId(request: Request) {
  return request.headers.get("x-request-id") ?? crypto.randomUUID();
}

export function ok<T>(data: T, request: Request, meta?: Record<string, unknown>) {
  return NextResponse.json({ data, meta: { requestId: requestId(request), ...meta } });
}

export function fail(code: string, message: string, request: Request, status = 400, fields?: Record<string, string[]>) {
  return NextResponse.json({ error: { code, message, ...(fields ? { fields } : {}) }, requestId: requestId(request) }, { status });
}
