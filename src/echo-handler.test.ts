import { describe, expect, test, beforeAll, afterAll } from "bun:test";
import type { Server } from "bun";
import {
  parseBody,
  parseQuery,
  parseHeaders,
  createEchoResponse,
  handleRequest,
} from "./echo-handler";

describe("parseBody", () => {
  test("returns null for GET requests", async () => {
    const request = new Request("http://localhost/test", { method: "GET" });
    const result = await parseBody(request);
    expect(result.parsed).toBeNull();
    expect(result.raw).toBeNull();
  });

  test("returns null for HEAD requests", async () => {
    const request = new Request("http://localhost/test", { method: "HEAD" });
    const result = await parseBody(request);
    expect(result.parsed).toBeNull();
    expect(result.raw).toBeNull();
  });

  test("parses JSON body correctly", async () => {
    const body = { name: "test", value: 123 };
    const request = new Request("http://localhost/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = await parseBody(request);
    expect(result.parsed).toEqual(body);
    expect(result.raw).toBe(JSON.stringify(body));
  });

  test("handles invalid JSON gracefully", async () => {
    const request = new Request("http://localhost/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "invalid json {",
    });
    const result = await parseBody(request);
    expect(result.parsed).toBeNull();
    expect(result.raw).toBe("invalid json {");
  });

  test("parses form-urlencoded body correctly", async () => {
    const request = new Request("http://localhost/test", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "name=test&value=123",
    });
    const result = await parseBody(request);
    expect(result.parsed).toEqual({ name: "test", value: "123" });
    expect(result.raw).toBe("name=test&value=123");
  });

  test("returns raw text for unknown content types", async () => {
    const request = new Request("http://localhost/test", {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: "Hello World",
    });
    const result = await parseBody(request);
    expect(result.parsed).toBeNull();
    expect(result.raw).toBe("Hello World");
  });

  test("handles empty body", async () => {
    const request = new Request("http://localhost/test", {
      method: "POST",
      body: "",
    });
    const result = await parseBody(request);
    expect(result.parsed).toBeNull();
    expect(result.raw).toBeNull();
  });
});

describe("parseQuery", () => {
  test("parses query parameters correctly", () => {
    const url = new URL("http://localhost/test?foo=bar&baz=qux");
    const result = parseQuery(url);
    expect(result).toEqual({ foo: "bar", baz: "qux" });
  });

  test("handles empty query string", () => {
    const url = new URL("http://localhost/test");
    const result = parseQuery(url);
    expect(result).toEqual({});
  });

  test("handles special characters in query", () => {
    const url = new URL("http://localhost/test?message=hello%20world&symbol=%26");
    const result = parseQuery(url);
    expect(result).toEqual({ message: "hello world", symbol: "&" });
  });
});

describe("parseHeaders", () => {
  test("parses headers correctly", () => {
    const headers = new Headers({
      "Content-Type": "application/json",
      "X-Custom-Header": "custom-value",
    });
    const result = parseHeaders(headers);
    expect(result["content-type"]).toBe("application/json");
    expect(result["x-custom-header"]).toBe("custom-value");
  });

  test("handles empty headers", () => {
    const headers = new Headers();
    const result = parseHeaders(headers);
    expect(result).toEqual({});
  });
});

describe("handleRequest", () => {
  let server: Server;

  beforeAll(() => {
    server = Bun.serve({
      port: 0,
      fetch() {
        return new Response("test");
      },
    });
  });

  afterAll(() => {
    server.stop();
  });

  test("returns JSON response with correct content type", async () => {
    const request = new Request("http://localhost/test");
    const response = await handleRequest(request, server);

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/json");
    expect(response.headers.get("X-Echo-Server")).toBe("http-echo-server/1.0.0");
  });

  test("echo response contains request method", async () => {
    const request = new Request("http://localhost/test", { method: "POST" });
    const response = await handleRequest(request, server);
    const body = await response.json();

    expect(body.request.method).toBe("POST");
  });

  test("echo response contains request path", async () => {
    const request = new Request("http://localhost/api/users/123");
    const response = await handleRequest(request, server);
    const body = await response.json();

    expect(body.request.path).toBe("/api/users/123");
  });

  test("echo response contains query parameters", async () => {
    const request = new Request("http://localhost/test?page=1&limit=10");
    const response = await handleRequest(request, server);
    const body = await response.json();

    expect(body.request.query).toEqual({ page: "1", limit: "10" });
  });

  test("echo response contains request headers", async () => {
    const request = new Request("http://localhost/test", {
      headers: {
        "X-Request-ID": "abc-123",
        Authorization: "Bearer token123",
      },
    });
    const response = await handleRequest(request, server);
    const body = await response.json();

    expect(body.request.headers["x-request-id"]).toBe("abc-123");
    expect(body.request.headers["authorization"]).toBe("Bearer token123");
  });

  test("echo response contains JSON body", async () => {
    const requestBody = { user: "test", action: "create" };
    const request = new Request("http://localhost/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });
    const response = await handleRequest(request, server);
    const body = await response.json();

    expect(body.request.body).toEqual(requestBody);
    expect(body.request.contentType).toBe("application/json");
  });

  test("echo response contains timestamp", async () => {
    const request = new Request("http://localhost/test");
    const response = await handleRequest(request, server);
    const body = await response.json();

    expect(body.timestamp).toBeDefined();
    expect(new Date(body.timestamp).getTime()).not.toBeNaN();
  });

  test("echo response contains server info", async () => {
    const request = new Request("http://localhost/test");
    const response = await handleRequest(request, server);
    const body = await response.json();

    expect(body.server).toBeDefined();
    expect(body.server.port).toBe(server.port);
  });

  test("handles all HTTP methods", async () => {
    const methods = ["GET", "POST", "PUT", "PATCH", "DELETE"];

    for (const method of methods) {
      const request = new Request("http://localhost/test", { method });
      const response = await handleRequest(request, server);
      const body = await response.json();

      expect(body.request.method).toBe(method);
    }
  });
});

describe("createEchoResponse", () => {
  let server: Server;

  beforeAll(() => {
    server = Bun.serve({
      port: 0,
      fetch() {
        return new Response("test");
      },
    });
  });

  afterAll(() => {
    server.stop();
  });

  test("creates complete echo response structure", async () => {
    const request = new Request("http://localhost/api/test?q=search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "test-client/1.0",
      },
      body: JSON.stringify({ data: "test" }),
    });

    const echoResponse = await createEchoResponse(request, server);

    expect(echoResponse).toHaveProperty("timestamp");
    expect(echoResponse).toHaveProperty("request");
    expect(echoResponse).toHaveProperty("client");
    expect(echoResponse).toHaveProperty("server");

    expect(echoResponse.request.method).toBe("POST");
    expect(echoResponse.request.path).toBe("/api/test");
    expect(echoResponse.request.query).toEqual({ q: "search" });
    expect(echoResponse.request.body).toEqual({ data: "test" });
    expect(echoResponse.client.userAgent).toBe("test-client/1.0");
  });
});
