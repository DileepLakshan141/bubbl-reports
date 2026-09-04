import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createBackendClient, toBffError } from "./backendClient";
import { ProxyOptions } from "../types/auth.types";

const ACCESS_TOKEN_COOKIE = process.env.ACCESS_TOKEN_COOKIE ?? "access_token";

export async function proxyToBackend(req: NextRequest, options: ProxyOptions) {
  const { path, ...axiosConfig } = options;
  const accessToken = (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;
  const client = createBackendClient(accessToken);

  try {
    const searchParams = req.nextUrl.search;
    const body =
      req.method !== "GET" && req.method !== "HEAD"
        ? await req.json().catch(() => undefined)
        : undefined;

    const response = await client.request({
      url: `${path}${searchParams}`,
      method: req.method,
      data: body,
      ...axiosConfig,
    });

    return NextResponse.json(response.data, { status: response.status });
  } catch (error) {
    const { status, message } = toBffError(error);
    return NextResponse.json({ message }, { status });
  }
}
