FROM node:20-alpine

RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY prisma ./prisma/
RUN npx prisma generate

COPY . .

EXPOSE 5000

# Run migrations and start the application
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
