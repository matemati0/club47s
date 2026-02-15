import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, resolveAuthMode } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "products");

const MIME_TO_EXTENSION: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/svg+xml": ".svg"
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

export async function POST(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
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

  const extension = resolveFileExtension(file);
  if (!extension) {
    return NextResponse.json(
      { message: "Unsupported image type" },
      { status: 415 }
    );
  }

  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const filename = `${Date.now()}-${crypto.randomBytes(10).toString("hex")}${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());
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
