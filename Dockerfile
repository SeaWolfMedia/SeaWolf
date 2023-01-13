# FROM node:lts-buster-slim AS base
# RUN apt-get update && apt-get install libssl-dev ca-certificates -y
# WORKDIR /app

# COPY package.json package-lock.json ./

# FROM base as build
# RUN export NODE_ENV=production
# RUN npm install

# COPY . .
# RUN npm run prisma:generate
# RUN npm run build

# FROM base as prod-build

# RUN npm install --production
# COPY prisma prisma
# RUN npm run prisma:generate
# RUN cp -R node_modules prod_node_modules

# FROM base as prod

# COPY --from=prod-build /app/prod_node_modules /app/node_modules
# COPY --from=build /app /app

# ENV NODE_ENV production

# VOLUME /data \
#     /content

# EXPOSE 52470

# CMD ["npm", "start"]







# Double-container Dockerfile for separated build process.
# If you're just copy-pasting this, don't forget a .dockerignore!

# We're starting with the same base image, but we're declaring
# that this block outputs an image called DEPS that we
# won't be deploying - it just installs our Yarn deps
FROM node:16-alpine AS deps

# If you need libc for any of your deps, uncomment this line:
# RUN apk add --no-cache libc6-compat

# Copy over ONLY the package.json and yarn.lock
# so that this `yarn install` layer is only recomputed
# if these dependency files change. Nice speed hack!
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# END DEPS IMAGE

# Now we make a container to handle our Build
FROM node:16-alpine AS BUILD_IMAGE

# Set up our work directory again
WORKDIR /app

# Bring over the deps we installed and now also
# the rest of the source code to build the Next
# server for production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN yarn build

# Remove all the development dependencies since we don't
# need them to run the actual server.
RUN rm -rf node_modules
RUN yarn install --production --frozen-lockfile --ignore-scripts --prefer-offline
RUN yarn prisma:generate

# END OF BUILD_IMAGE

# This starts our application's run image - the final output of build.
FROM node:16-alpine

ENV NODE_ENV production

#RUN addgroup -g 1001 -S nodejs
#RUN adduser -S nextjs -u 1001

# Pull the built files out of BUILD_IMAGE - we need:
# 1. the package.json and yarn.lock
# 2. the Next build output and static files
# 3. the node_modules.
WORKDIR /app

# --chown=nextjs:nodejs

COPY --from=BUILD_IMAGE /app/.next ./.next
# COPY --from=BUILD_IMAGE /app/.next/standalone/.next/server/ ./.next
COPY --from=BUILD_IMAGE /app/bin ./bin
COPY --from=BUILD_IMAGE /app/node_modules ./node_modules
COPY --from=BUILD_IMAGE /app/.next/standalone/node_modules ./node_modules
COPY --from=BUILD_IMAGE /app/prisma ./prisma
COPY --from=BUILD_IMAGE /app/public ./public
COPY --from=BUILD_IMAGE /app/server ./server
COPY --from=BUILD_IMAGE /app/package.json /app/yarn.lock /app/config-default.json /app/next.config.js ./

RUN rm -rf ./.next/standalone

# 4. OPTIONALLY the next.config.js, if your app has one
# COPY --from=BUILD_IMAGE --chown=nextjs:nodejs   ./
# COPY --from=BUILD_IMAGE --chown=nextjs:nodejs   ./

#USER nextjs

EXPOSE 52470

VOLUME /data \
    /content

CMD [ "yarn", "start" ]







# FROM node:16

# # Create app directory
# WORKDIR /usr/src/app

# # Install app dependencies
# # A wildcard is used to ensure both package.json AND package-lock.json are copied
# # where available (npm@5+)
# COPY package.json yarn.lock ./

# # If you are building your code for production
# # RUN npm ci --only=production

# # Bundle app source
# COPY . .

# RUN yarn install && yarn build && yarn prisma:generate

# VOLUME /data \
#     /content

# EXPOSE 52470

# CMD [ "yarn", "start" ]