FROM node:lts-buster-slim AS base
RUN apt-get update && apt-get install libssl-dev ca-certificates -y
WORKDIR /app

COPY package.json package-lock.json ./

FROM base as build
RUN export NODE_ENV=production
RUN npm install

COPY . .
RUN npm run prisma:generate
RUN npm run build

FROM base as prod-build

RUN npm install --production
COPY prisma prisma
RUN npm run prisma:generate
RUN cp -R node_modules prod_node_modules

FROM base as prod

COPY --from=prod-build /app/prod_node_modules /app/node_modules
COPY --from=build /app /app

ENV NODE_ENV production

VOLUME /data \
    /content

EXPOSE 52470

CMD ["npm", "start"]