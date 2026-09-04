import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { getSession, hasAccess } from "@/lib/session/session";
import { Role, Session } from "../types/auth.types";

type Handler = (
  req: NextRequest,
  session: Session,
) => Promise<Response> | Response;

export function withRole(allowedRoles: Role[], handler: Handler) {
  return async (req: NextRequest) => {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (!hasAccess(session, allowedRoles)) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    return handler(req, session);
  };
}

export function withAuth(handler: Handler) {
  return async (req: NextRequest) => {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    return handler(req, session);
  };
}
