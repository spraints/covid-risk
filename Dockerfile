FROM ruby:2.7.1 AS data

RUN apt-get update && apt-get install -y curl ruby

WORKDIR /src

COPY script/get-data script/get-data
RUN script/get-data

COPY script/split-data script/split-data
RUN script/split-data

FROM nginx:1.19

WORKDIR /site
#COPY conf.d /etc/nginx/conf.d
COPY public /usr/share/nginx/html
COPY --from=data /src/public/data /usr/share/nginx/html/data
