import { createHash, createHmac, randomUUID } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { getServerEnv } from "@/lib/env";

const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Map<string, string>([
  ["image/png", "png"],
  ["image/jpeg", "jpg"],
  ["image/webp", "webp"]
]);

function sha256Hex(value: Buffer | string): string {
  return createHash("sha256").update(value).digest("hex");
}

function hmac(key: Buffer | string, value: string): Buffer {
  return createHmac("sha256", key).update(value).digest();
}

function toAmzDate(date: Date): { long: string; short: string } {
  const iso = date.toISOString().replace(/[:-]|\.\d{3}/g, "");
  return {
    long: iso,
    short: iso.slice(0, 8)
  };
}

function getSignatureKey(secret: string, date: string, region: string): Buffer {
  const kDate = hmac(`AWS4${secret}`, date);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, "s3");
  return hmac(kService, "aws4_request");
}

function encodeS3Key(key: string): string {
  return key.split("/").map((segment) => encodeURIComponent(segment)).join("/");
}

function getLocalUploadsRoot(): string {
  return path.join(process.cwd(), "public", "uploads", "avatars");
}

function detectFileExtension(contentType: string, buffer: Buffer): string {
  const declaredExtension = ALLOWED_TYPES.get(contentType);

  if (!declaredExtension) {
    throw new Error("UNSUPPORTED_AVATAR_TYPE");
  }

  const isPng = buffer.length > 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const isJpeg = buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const isWebp = buffer.length > 12 && buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP";

  if (contentType === "image/png" && !isPng) {
    throw new Error("UNSUPPORTED_AVATAR_SIGNATURE");
  }

  if (contentType === "image/jpeg" && !isJpeg) {
    throw new Error("UNSUPPORTED_AVATAR_SIGNATURE");
  }

  if (contentType === "image/webp" && !isWebp) {
    throw new Error("UNSUPPORTED_AVATAR_SIGNATURE");
  }

  return declaredExtension;
}

export async function validateAvatarFile(file: File | null | undefined): Promise<{ buffer: Buffer; contentType: string; extension: string }> {
  if (!file || file.size === 0) {
    throw new Error("AVATAR_REQUIRED");
  }

  if (file.size > MAX_AVATAR_SIZE_BYTES) {
    throw new Error("AVATAR_TOO_LARGE");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const extension = detectFileExtension(file.type, buffer);

  return {
    buffer,
    contentType: file.type,
    extension
  };
}

async function uploadToLocalStorage(key: string, buffer: Buffer): Promise<string> {
  const root = getLocalUploadsRoot();
  const absolutePath = path.join(root, key.replace(/^avatars\//, ""));
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, buffer);
  return `/uploads/avatars/${key.replace(/^avatars\//, "")}`;
}

async function removeFromLocalStorage(key: string): Promise<void> {
  const root = getLocalUploadsRoot();
  const absolutePath = path.resolve(root, key.replace(/^avatars\//, ""));

  if (!absolutePath.startsWith(path.resolve(root))) {
    throw new Error("INVALID_AVATAR_KEY");
  }

  await rm(absolutePath, { force: true });
}

async function signedS3Request(input: {
  method: "PUT" | "DELETE";
  key: string;
  contentType?: string;
  body?: Buffer;
}): Promise<void> {
  const env = getServerEnv();

  if (!env.S3_BUCKET || !env.S3_REGION || !env.S3_ACCESS_KEY_ID || !env.S3_SECRET_ACCESS_KEY) {
    throw new Error("STORAGE_NOT_CONFIGURED");
  }

  const host = `${env.S3_BUCKET}.s3.${env.S3_REGION}.amazonaws.com`;
  const encodedKey = encodeS3Key(input.key);
  const now = new Date();
  const amzDate = toAmzDate(now);
  const payloadHash = sha256Hex(input.body ?? Buffer.alloc(0));
  const canonicalHeaders = [
    `host:${host}`,
    `x-amz-content-sha256:${payloadHash}`,
    `x-amz-date:${amzDate.long}`,
    ...(input.contentType ? [`content-type:${input.contentType}`] : [])
  ].join("\n");
  const signedHeaders = ["host", "x-amz-content-sha256", "x-amz-date", ...(input.contentType ? ["content-type"] : [])].join(";");
  const canonicalRequest = [
    input.method,
    `/${encodedKey}`,
    "",
    `${canonicalHeaders}\n`,
    signedHeaders,
    payloadHash
  ].join("\n");
  const credentialScope = `${amzDate.short}/${env.S3_REGION}/s3/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate.long,
    credentialScope,
    sha256Hex(canonicalRequest)
  ].join("\n");
  const signature = createHmac("sha256", getSignatureKey(env.S3_SECRET_ACCESS_KEY, amzDate.short, env.S3_REGION)).update(stringToSign).digest("hex");
  const authorization = `AWS4-HMAC-SHA256 Credential=${env.S3_ACCESS_KEY_ID}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const response = await fetch(`https://${host}/${encodedKey}`, {
    method: input.method,
    headers: {
      Authorization: authorization,
      "Content-Type": input.contentType ?? "application/octet-stream",
      "X-Amz-Content-Sha256": payloadHash,
      "X-Amz-Date": amzDate.long
    },
    body: input.body ? new Uint8Array(input.body) : undefined,
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`S3_${input.method}_FAILED_${response.status}`);
  }
}

export async function storeAvatarAsset(userId: string, file: File): Promise<{ key: string; url: string }> {
  const env = getServerEnv();
  const { buffer, contentType, extension } = await validateAvatarFile(file);
  const key = `avatars/${userId}/${Date.now()}-${randomUUID()}.${extension}`;

  if (env.STORAGE_DRIVER === "cloud") {
    await signedS3Request({
      method: "PUT",
      key,
      contentType,
      body: buffer
    });

    return {
      key,
      url: `https://${env.S3_BUCKET}.s3.${env.S3_REGION}.amazonaws.com/${encodeS3Key(key)}`
    };
  }

  const url = await uploadToLocalStorage(key, buffer);
  return { key, url };
}

export async function removeAvatarAsset(key: string | null | undefined): Promise<void> {
  if (!key) {
    return;
  }

  const env = getServerEnv();

  if (env.STORAGE_DRIVER === "cloud") {
    await signedS3Request({
      method: "DELETE",
      key
    });
    return;
  }

  await removeFromLocalStorage(key);
}

