FROM node:alpine3.18 AS builder
WORKDIR /usr/src
COPY package.json .
COPY package-lock.json .
RUN npm ci
COPY . .
ENV NODE_OPTIONS=--openssl-legacy-provider
RUN npm run build

FROM bitnami/express:4.18.2
WORKDIR /usr/app
COPY package.json .
COPY package-lock.json .
RUN npm ci --omit=dev
COPY db db
COPY --from=builder /usr/src/build public
COPY --from=builder /usr/src/*.js .
EXPOSE 8080
CMD ["node", "server.js"]
