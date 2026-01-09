import type { Server } from "bun";
import type { EchoResponse } from "./types";

export async function parseBody(
  request: Request
): Promise<{ parsed: unknown; raw: string | null }> {
  const contentType = request.headers.get("content-type");

  if (
    request.method === "GET" ||
    request.method === "HEAD" ||
    request.method === "OPTIONS"
  ) {
    return { parsed: null, raw: null };
  }

  try {
    const rawBody = await request.text();

    if (!rawBody || rawBody.length === 0) {
      return { parsed: null, raw: null };
    }

    if (contentType?.includes("application/json")) {
      try {
        return { parsed: JSON.parse(rawBody), raw: rawBody };
      } catch {
        return { parsed: null, raw: rawBody };
      }
    }

    if (contentType?.includes("application/x-www-form-urlencoded")) {
      const formData: Record<string, string> = {};
      const params = new URLSearchParams(rawBody);
      for (const [key, value] of params) {
        formData[key] = value;
      }
      return { parsed: formData, raw: rawBody };
    }

    return { parsed: null, raw: rawBody };
  } catch {
    return { parsed: null, raw: null };
  }
}

export function parseQuery(url: URL): Record<string, string> {
  const query: Record<string, string> = {};
  for (const [key, value] of url.searchParams) {
    query[key] = value;
  }
  return query;
}

export function parseHeaders(headers: Headers): Record<string, string> {
  const result: Record<string, string> = {};
  headers.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}

export async function createEchoResponse(
  request: Request,
  server: Server
): Promise<EchoResponse> {
  const url = new URL(request.url);
  const { parsed: body, raw: bodyRaw } = await parseBody(request);
  const headers = parseHeaders(request.headers);

  return {
    timestamp: new Date().toISOString(),
    request: {
      method: request.method,
      url: request.url,
      path: url.pathname,
      query: parseQuery(url),
      headers,
      body,
      bodyRaw,
      contentType: request.headers.get("content-type"),
      contentLength: request.headers.get("content-length")
        ? parseInt(request.headers.get("content-length")!, 10)
        : null,
    },
    client: {
      ip: server.requestIP(request)?.address ?? null,
      userAgent: request.headers.get("user-agent"),
    },
    server: {
      hostname: url.hostname,
      port: server.port,
    },
  };
}

export async function handleRequest(
  request: Request,
  server: Server
): Promise<Response> {
  const echoResponse = await createEchoResponse(request, server);

  return new Response(JSON.stringify(echoResponse, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "X-Echo-Server": "http-echo-server/1.0.0",
    },
  });
}
