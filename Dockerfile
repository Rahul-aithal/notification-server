# Stage 1: Build
FROM oven/bun:1.1-slim 

WORKDIR /app


# Copy package files first for better caching
COPY package.json bun.lockb ./
RUN bun install --production


# Copy source files
COPY . .


# Expose application port
EXPOSE 4000

# Command to start the application
CMD ["bun","run","start"]
