# Standalone build, context = this folder:   docker build -t demo-host-client demo-host-client/
# The image talks to the app server only (APP_SERVER_URL), never to WALRUS.
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# http: use the app server. mock: the in-memory stand-in, no backend needed.
ARG VITE_API_MODE=http
ENV VITE_API_MODE=$VITE_API_MODE
RUN npm run build

FROM nginx:1.27-alpine
ENV APP_SERVER_URL=http://server:8081
# nginx fills ${APP_SERVER_URL} in when the container starts
COPY deploy/nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
