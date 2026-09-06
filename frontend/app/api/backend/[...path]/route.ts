import "server-only";
import { NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/bff/proxyToBackend";

function buildPath(pathSegments: string[]) {
  return "/" + pathSegments.join("/");
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;

  return proxyToBackend(req, { path: buildPath(path) });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return proxyToBackend(req, { path: buildPath(path) });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return proxyToBackend(req, { path: buildPath(path) });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return proxyToBackend(req, { path: buildPath(path) });
}
