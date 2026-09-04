import "server-only";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { Role, Session } from "../types/auth.types";

const secret = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET);
const ACCESS_TOKEN_COOKIE = process.env.ACCESS_TOKEN_COOKIE ?? "access_token";

export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret);
    return {
      sub: Number(payload.sub) as number,
      email: payload.email as string,
      username: payload.username as string,
      role: payload.role as Role,
    };
  } catch {
    return null;
  }
}

export function hasAccess(
  session: Session | null,
  allowedRoles: Role[],
): boolean {
  return !!session && allowedRoles.includes(session.role);
}
