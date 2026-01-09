FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies into a temp directory for caching
FROM base AS install
RUN mkdir -p /temp/prod
COPY package.json bun.lock /temp/prod/
RUN cd /temp/prod && bun install --frozen-lockfile --production

# Copy source and installed dependencies
FROM base AS release
COPY --from=install /temp/prod/node_modules node_modules
COPY package.json bun.lock ./
COPY src ./src

# Set environment variables
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Expose the port
EXPOSE 3000

# Run the server
USER bun
CMD ["bun", "run", "src/index.ts"]
