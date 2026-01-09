export interface EchoResponse {
  timestamp: string;
  request: {
    method: string;
    url: string;
    path: string;
    query: Record<string, string>;
    headers: Record<string, string>;
    body: unknown;
    bodyRaw: string | null;
    contentType: string | null;
    contentLength: number | null;
  };
  client: {
    ip: string | null;
    userAgent: string | null;
  };
  server: {
    hostname: string;
    port: number;
  };
}
