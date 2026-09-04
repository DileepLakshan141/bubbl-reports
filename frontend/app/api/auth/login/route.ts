import { NextResponse, type NextRequest } from "next/server";
import { createBackendClient, toBffError } from "@/lib/bff/backendClient";
import { LoginResponse } from "../../../../lib/types/auth.types";

const ACCESS_TOKEN_COOKIE = process.env.ACCESS_TOKEN_COOKIE ?? "access_token";
const ACCESS_TOKEN_MAX_AGE = Number(process.env.ACCESS_TOKEN_MAX_AGE ?? 900);

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  if (!body) {
    return NextResponse.json(
      { message: "Invalid or missing request body" },
      { status: 400 },
    );
  }

  const client = createBackendClient();

  try {
    const { data } = await client.post<LoginResponse>("/auth/login", body);
    const { accessToken, user } = data;

    const res = NextResponse.json({ user });

    res.cookies.set(ACCESS_TOKEN_COOKIE, accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: ACCESS_TOKEN_MAX_AGE,
    });

    return res;
  } catch (error) {
    const { status, message } = toBffError(error);
    return NextResponse.json({ message }, { status });
  }
}
