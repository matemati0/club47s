import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, resolveAuthMode } from "@/lib/auth";
import { ensureTrustedMutationOrigin } from "@/lib/security/requestOrigin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "products");

const MIME_TO_EXTENSION: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif"
};

const ALLOWED_EXTENSIONS = new Set([...Object.values(MIME_TO_EXTENSION), ".jpeg"]);

function isAdminRequest(request: NextRequest) {
  return resolveAuthMode(request.cookies.get(AUTH_COOKIE_NAME)?.value).then(
    (mode) => mode === "admin"
  );
}

function resolveFileExtension(file: File) {
  const mimeExt = MIME_TO_EXTENSION[file.type?.toLowerCase()];
  if (mimeExt) {
    return mimeExt;
  }

  const nameExt = path.extname(file.name ?? "").toLowerCase();
  if (ALLOWED_EXTENSIONS.has(nameExt)) {
    return nameExt;
  }

  return null;
}

function detectImageExtensionFromBuffer(buffer: Buffer) {
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return ".jpg";
  }

  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return ".png";
  }

  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return ".webp";
  }

  if (
    buffer.length >= 6 &&
    (buffer.subarray(0, 6).toString("ascii") === "GIF87a" ||
      buffer.subarray(0, 6).toString("ascii") === "GIF89a")
  ) {
    return ".gif";
  }

  return null;
}

function extensionsMatch(expected: string | null, detected: string) {
  if (!expected) {
    return true;
  }

  if (expected === ".jpeg" && detected === ".jpg") {
    return true;
  }

  return expected === detected;
}

export async function POST(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const originRejection = ensureTrustedMutationOrigin(request);
  if (originRejection) {
    return originRejection;
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ message: "Missing file" }, { status: 400 });
  }

  if (file.size <= 0) {
    return NextResponse.json({ message: "Empty file" }, { status: 400 });
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json(
      { message: "File is too large" },
      { status: 413 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const detectedExtension = detectImageExtensionFromBuffer(buffer);
  if (!detectedExtension) {
    return NextResponse.json({ message: "Unsupported image type" }, { status: 415 });
  }

  const declaredExtension = resolveFileExtension(file);
  if (!extensionsMatch(declaredExtension, detectedExtension)) {
    return NextResponse.json(
      { message: "File content does not match declared image type" },
      { status: 415 }
    );
  }

  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const filename = `${Date.now()}-${crypto.randomBytes(10).toString("hex")}${detectedExtension}`;
  await fs.writeFile(path.join(UPLOAD_DIR, filename), buffer);

  return NextResponse.json(
    { path: `/uploads/products/${filename}` },
    {
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}
