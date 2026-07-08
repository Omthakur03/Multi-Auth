# Use Node.js 20 Alpine as base image
FROM node:20-alpine

# Install openssl for Prisma client engines
RUN apk add --no-cache openssl

# Set working directory
WORKDIR /app

# Copy package files first to leverage caching
COPY package*.json ./

# Install dependencies (including devDependencies like prisma, which is needed to run migrations)
RUN npm ci

# Copy Prisma schema and generate Prisma client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy the rest of the application files (except what's ignored in .dockerignore)
COPY . .

# Expose the API port
EXPOSE 5000

# Run migrations and start the application
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
