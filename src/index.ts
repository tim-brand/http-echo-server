import { handleRequest } from "./echo-handler";

const PORT = parseInt(process.env.PORT || "3000", 10);
const HOSTNAME = process.env.HOSTNAME || "0.0.0.0";

const server = Bun.serve({
  port: PORT,
  hostname: HOSTNAME,
  fetch(request, server) {
    return handleRequest(request, server);
  },
});

console.log(`🚀 HTTP Echo Server is running at http://${HOSTNAME}:${server.port}`);
console.log(`📡 All requests will be echoed back with full request details`);

export { server };
