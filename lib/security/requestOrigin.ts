import { NextRequest, NextResponse } from "next/server";

function normalizeOrigin(value: string) {
  try {
    const url = new URL(value);
    return `${url.protocol}//${url.host}`.toLowerCase();
  } catch {
    return "";
  }
}

function resolveExpectedOrigin(request: NextRequest) {
  const configured = process.env.TRUSTED_APP_ORIGIN?.trim();
  if (configured) {
    const normalizedConfigured = normalizeOrigin(configured);
    if (normalizedConfigured) {
      return normalizedConfigured;
    }
  }

  const forwardedProto = request.headers
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim()
    .toLowerCase();
  const forwardedHost = request.headers
    .get("x-forwarded-host")
    ?.split(",")[0]
    ?.trim()
    .toLowerCase();

  if (forwardedProto && forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  const host = request.headers
    .get("host")
    ?.split(",")[0]
    ?.trim()
    .toLowerCase();
  const protocol = request.nextUrl.protocol.replace(":", "").toLowerCase();

  if (host && protocol) {
    return `${protocol}://${host}`;
  }

  return normalizeOrigin(request.nextUrl.origin);
}

function isTrustedSource(request: NextRequest, expectedOrigin: string) {
  const originHeader = request.headers.get("origin");
  if (originHeader) {
    return normalizeOrigin(originHeader) === expectedOrigin;
  }

  const refererHeader = request.headers.get("referer");
  if (refererHeader) {
    return normalizeOrigin(refererHeader) === expectedOrigin;
  }

  return process.env.NODE_ENV !== "production";
}

export function ensureTrustedMutationOrigin(request: NextRequest) {
  const expectedOrigin = resolveExpectedOrigin(request);
  if (!expectedOrigin) {
    return process.env.NODE_ENV === "production"
      ? NextResponse.json({ message: "Request origin validation failed" }, { status: 403 })
      : null;
  }

  if (isTrustedSource(request, expectedOrigin)) {
    return null;
  }

  return NextResponse.json(
    { message: "Cross-site request blocked" },
    { status: 403 }
  );
}

