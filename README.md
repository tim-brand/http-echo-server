# HTTP Echo Server

A lightweight REST service that echoes back all HTTP request details as JSON. Built with [Bun](https://bun.sh/) and TypeScript.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Bun](https://img.shields.io/badge/Bun-1.x-black)](https://bun.sh/)

## Features

- Echoes complete HTTP request details (method, headers, path, query, body)
- Supports all HTTP methods (GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS)
- Automatic body parsing for JSON, form-urlencoded, and plain text
- Returns nicely formatted JSON responses
- Docker ready with multi-stage builds
- Configurable via environment variables

## Quick Start

### Prerequisites

- [Bun](https://bun.sh/) v1.0 or later

### Installation

```bash
git clone https://github.com/tim-brand/http-echo-server.git
cd http-echo-server
bun install
```

### Run the Server

```bash
bun start
```

The server starts at `http://localhost:3000` by default.

### Try It Out

```bash
curl http://localhost:3000/hello?name=world
```

## Usage Examples

### GET Request with Query Parameters

```bash
curl "http://localhost:3000/api/users?page=1&limit=10"
```

### POST Request with JSON Body

```bash
curl -X POST http://localhost:3000/api/data \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, Echo!"}'
```

### POST Request with Form Data

```bash
curl -X POST http://localhost:3000/submit \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "name=John&email=john@example.com"
```

## Response Structure

All requests return a JSON response with the following structure:

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "request": {
    "method": "POST",
    "url": "http://localhost:3000/api/data?foo=bar",
    "path": "/api/data",
    "query": {
      "foo": "bar"
    },
    "headers": {
      "host": "localhost:3000",
      "content-type": "application/json",
      "user-agent": "curl/8.0.0"
    },
    "body": {
      "message": "Hello, Echo!"
    },
    "bodyRaw": "{\"message\": \"Hello, Echo!\"}",
    "contentType": "application/json",
    "contentLength": 27
  },
  "client": {
    "ip": "127.0.0.1",
    "userAgent": "curl/8.0.0"
  },
  "server": {
    "hostname": "0.0.0.0",
    "port": 3000
  }
}
```

## Configuration

Configure the server using environment variables:

| Variable   | Default   | Description                    |
|------------|-----------|--------------------------------|
| `PORT`     | `3000`    | Port the server listens on     |
| `HOSTNAME` | `0.0.0.0` | Hostname/address to bind to    |

Example:

```bash
PORT=8080 HOSTNAME=127.0.0.1 bun start
```

## Docker

### Build and Run Locally

```bash
docker build -t http-echo-server .
docker run -p 3000:3000 http-echo-server
```

### Using a Custom Port

```bash
docker run -p 8080:3000 http-echo-server
```

### Pull from GitHub Container Registry

```bash
docker pull ghcr.io/tim-brand/http-echo-server:latest
docker run -p 3000:3000 ghcr.io/tim-brand/http-echo-server:latest
```

## Development

### Run in Development Mode (with hot reload)

```bash
bun run dev
```

### Run Tests

```bash
bun test
```

### Project Structure

```
http-echo-server/
├── src/
│   ├── index.ts           # Server entry point
│   ├── echo-handler.ts    # Request handling logic
│   ├── echo-handler.test.ts # Test suite
│   └── types.ts           # TypeScript types
├── Dockerfile             # Container configuration
├── package.json
└── tsconfig.json
```

## License

MIT
