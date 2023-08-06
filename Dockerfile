FROM node:12.22.12-alpine AS builder
WORKDIR /usr/src
COPY package.json .
COPY package-lock.json .
RUN npm ci
COPY . .
RUN npm run build

FROM node:12.22.12-alpine
WORKDIR /usr/app
COPY package.json .
COPY package-lock.json .
RUN npm ci --omit=dev
COPY --from=builder /usr/src/build public
COPY --from=builder /usr/src/*.js .
EXPOSE 8080
CMD ["node", "server.js"]
