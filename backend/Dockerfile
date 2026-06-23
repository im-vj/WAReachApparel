FROM node:18-alpine

WORKDIR /app

# Install openssl which is required for Prisma in alpine
RUN apk add --no-cache openssl

COPY package*.json ./

RUN npm install

COPY . .

# Generate Prisma client
RUN npx prisma generate

EXPOSE 8080

CMD ["npm", "start"]
