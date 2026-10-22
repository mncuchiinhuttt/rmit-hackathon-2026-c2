export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    readonly publicMessage: string,
    readonly responseHeaders?: HeadersInit,
  ) {
    super(publicMessage);
    this.name = "ApiError";
  }
}

const SAFE_HEADERS = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "no-referrer",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

export function jsonResponse<T>(body: T, status = 200): Response {
  return Response.json(body, { status, headers: SAFE_HEADERS });
}

export function errorResponse(error: unknown): Response {
  const apiError = error instanceof ApiError
    ? error
    : new ApiError(500, "internal_error", "The request could not be completed.");
  const headers = new Headers(SAFE_HEADERS);
  if (apiError.responseHeaders) {
    new Headers(apiError.responseHeaders).forEach((value, key) => headers.set(key, value));
  }
  return Response.json(
    { error: apiError.publicMessage, code: apiError.code },
    { status: apiError.status, headers },
  );
}

export function secureResponse(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(SAFE_HEADERS)) {
    headers.set(name, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
