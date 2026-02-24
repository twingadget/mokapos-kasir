import { NextResponse } from "next/server";

export const FLASH_COOKIE = "moka_flash";
const FLASH_MAX_AGE_SECONDS = 30;

export type FlashType = "success" | "error";

export type FlashPayload = {
    type: FlashType;
    message: string;
};

function base64UrlEncode(value: string): string {
    return Buffer.from(value, "utf8").toString("base64url");
}

export function withFlash(response: NextResponse, payload: FlashPayload): NextResponse {
    const encoded = base64UrlEncode(JSON.stringify(payload));

    response.cookies.set(FLASH_COOKIE, encoded, {
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: FLASH_MAX_AGE_SECONDS,
        httpOnly: false,
    });

    return response;
}
