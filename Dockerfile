FROM node:18-alpine AS deps

WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --production --frozen-lockfile

FROM node:18-alpine AS builder

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN yarn build

FROM node:18-alpine AS runner

RUN apk update && apk add inotify-tools
ENV NODE_ENV production
WORKDIR /app
COPY --from=builder /app ./

EXPOSE 52470

VOLUME /content \
    /data

CMD [ "yarn", "start" ]