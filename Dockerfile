####################
FROM ruby:2.7.1 AS data

RUN apt-get update && apt-get install -y curl ruby

WORKDIR /src

ARG CACHE_VERSION=0
RUN echo $CACHE_VERSION > version

COPY script/get-data script/get-data
RUN script/get-data

COPY script/split-data script/split-data
RUN script/split-data

####################
FROM node:14.3.0 AS assets

WORKDIR /src

COPY package.json      package.json
COPY package-lock.json package-lock.json
RUN npm install

COPY rollup.config.js rollup.config.js
COPY tsconfig.json    tsconfig.json
COPY assets           assets

RUN npm run tsc && npm run build-js

####################
FROM nginx:1.19

WORKDIR /site
COPY               public             /usr/share/nginx/html
COPY --from=assets /src/public/assets /usr/share/nginx/html/assets
COPY --from=data   /src/public/data   /usr/share/nginx/html/data
