# Use Microsoft's official Playwright image (includes browsers + dependencies)
FROM mcr.microsoft.com/playwright:v1.50.1-noble AS base

# install unzip
RUN apt-get update && apt-get install -y unzip

# Install Bun
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:$PATH"

# Set working directory
WORKDIR /app

# Copy package files first (for better Docker layer caching)
COPY package.json bun.lock ./

# Install dependencies
RUN bun install --frozen-lockfile

# Install Playwright browsers (redundant but ensures everything is in place)
RUN bunx playwright install --with-deps

# Copy the rest of the application
COPY . .

# Build the application (assuming it has a build step)
RUN bun run build

# copy the playwright config into the output directory
COPY playwright.config.ts ./output/playwright.config.ts

# Change to the output directory if needed
WORKDIR /app/output

# Expose the port your app runs on
EXPOSE 3000

# Start the application
CMD ["./server"]
