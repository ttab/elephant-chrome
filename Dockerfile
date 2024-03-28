FROM node:20.12.0-slim AS build

ARG npm_authtoken

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.json package-lock.json tsconfig.json /usr/src/app/
RUN echo "@ttab:registry=https://npm.pkg.github.com/\n//npm.pkg.github.com/:_authToken=${npm_authtoken}" >> .npmrc
RUN npm ci

COPY . /usr/src/app

RUN npm run build

RUN rm -fr node_modules && \
    npm ci --include prod && \
    rm -f .npmrc

FROM node:20.12.0-slim

RUN apt-get update && apt-get upgrade -y && apt-get clean

WORKDIR /usr/src/app

COPY --from=build /usr/src/app /usr/src/app

EXPOSE 5183
CMD [ "npm", "start" ]
