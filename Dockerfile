FROM node:14.3.0 AS assets
WORKDIR /src
RUN mkdir /src/public && mkdir /src/public/assets
# TBD

FROM golang:1.14.3 AS data
WORKDIR /src
COPY script/get-data script/get-data
RUN script/get-data

FROM golang:1.14.3
WORKDIR /src
COPY go.mod .
COPY go.sum .
RUN go mod download
COPY cmd cmd
COPY pkg pkg
RUN go build -o /usr/bin/covid-safe ./cmd/covid-safe
COPY --from=assets /src/public/assets /app/public/assets
COPY --from=data   /src/data          /app/data
COPY public    /app/public
COPY templates /app/templates
ENV LISTEN_ADDR=:8080
ENV PUBLIC_PATH=/app/public
ENV TEMPLATES_PATH=/app/templates
ENTRYPOINT [ "/usr/bin/covid-safe" ]
