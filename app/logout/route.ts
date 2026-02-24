import { NextRequest, NextResponse } from "next/server";
import { clearSession } from "@/lib/auth";

function buildLogoutResponse(request: NextRequest): NextResponse {
    const response = NextResponse.redirect(new URL("/login", request.url), { status: 303 });
    return clearSession(response);
}

export async function GET(request: NextRequest): Promise<NextResponse> {
    return buildLogoutResponse(request);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    return buildLogoutResponse(request);
}
