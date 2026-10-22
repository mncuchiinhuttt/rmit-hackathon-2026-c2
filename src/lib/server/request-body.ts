import { ApiError } from "@/lib/server/api-errors";

export const MAX_BODY_BYTES = 64 * 1024;

export async function readJsonStream(body: ReadableStream<Uint8Array> | null, headers: Headers, maxBytes = MAX_BODY_BYTES): Promise<unknown> {
  const mediaType = headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase();
  if (mediaType !== "application/json") {
    throw new ApiError(415, "unsupported_media_type", "Send a JSON request body.");
  }

  const declaredLength = headers.get("content-length");
  if (declaredLength !== null) {
    if (!/^(0|[1-9]\d*)$/.test(declaredLength)) {
      throw new ApiError(400, "invalid_content_length", "The request body is invalid.");
    }
    if (Number(declaredLength) > maxBytes) {
      throw new ApiError(413, "payload_too_large", `The JSON body exceeds ${maxBytes / 1024} KB.`);
    }
  }

  if (!body) throw new ApiError(400, "invalid_json", "A JSON request body is required.");
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > maxBytes) {
        await reader.cancel();
        throw new ApiError(413, "payload_too_large", `The JSON body exceeds ${maxBytes / 1024} KB.`);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new ApiError(400, "invalid_json", "The request body is not valid UTF-8 JSON.");
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new ApiError(400, "invalid_json", "The request body is not valid JSON.");
  }
}

export function readJsonBody(request: Request): Promise<unknown> {
  return readJsonStream(request.body, request.headers);
}

export function requireJsonObject(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new ApiError(400, "invalid_request", "The request body must be a JSON object.");
  }
  return value as Record<string, unknown>;
}
