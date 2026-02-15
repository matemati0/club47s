const encoder = new TextEncoder();

function bytesToBase64(bytes: Uint8Array) {
  // Node.js
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  }

  // Edge runtime
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function base64ToBytes(base64: string) {
  // Node.js
  if (typeof Buffer !== "undefined") {
    return Uint8Array.from(Buffer.from(base64, "base64"));
  }

  // Edge runtime
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function base64UrlEncode(bytes: Uint8Array) {
  return bytesToBase64(bytes)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = `${base64}${"=".repeat((4 - (base64.length % 4)) % 4)}`;
  return base64ToBytes(padded);
}

function constantTimeEqual(left: string, right: string) {
  if (left.length !== right.length) {
    return false;
  }

  let result = 0;
  for (let index = 0; index < left.length; index += 1) {
    result |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return result === 0;
}

async function sign(secret: string, data: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return base64UrlEncode(new Uint8Array(signature));
}

async function verify(secret: string, data: string, signature: string) {
  const expected = await sign(secret, data);
  return constantTimeEqual(expected, signature);
}

export async function signJson<TPayload extends Record<string, unknown>>(
  payload: TPayload,
  secret: string
) {
  const payloadBytes = encoder.encode(JSON.stringify(payload));
  const payloadPart = base64UrlEncode(payloadBytes);
  const signaturePart = await sign(secret, payloadPart);
  return `${payloadPart}.${signaturePart}`;
}

export async function verifyJson<TPayload extends Record<string, unknown>>(
  token: string,
  secret: string
) {
  const [payloadPart, signaturePart] = token.split(".");
  if (!payloadPart || !signaturePart) {
    return null;
  }

  const ok = await verify(secret, payloadPart, signaturePart);
  if (!ok) {
    return null;
  }

  try {
    const payloadJson = new TextDecoder().decode(base64UrlDecode(payloadPart));
    const parsed = JSON.parse(payloadJson) as unknown;
    if (!parsed || typeof parsed !== "object") {
      return null;
    }
    return parsed as TPayload;
  } catch {
    return null;
  }
}

