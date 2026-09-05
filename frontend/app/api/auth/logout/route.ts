import { NextResponse } from "next/server";

const ACCESS_TOKEN_COOKIE = process.env.ACCESS_TOKEN_COOKIE ?? "access_token";

export async function POST() {
  const response = NextResponse.json({ success: true });

  response.cookies.set(ACCESS_TOKEN_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });

  return response;
}
