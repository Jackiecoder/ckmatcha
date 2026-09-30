FROM node:24-alpine

WORKDIR /app
ENV NODE_ENV=production \
    PORT=8080 \
    HOST=0.0.0.0

COPY --chown=node:node server.mjs ./
COPY --chown=node:node dist/ ./dist/

USER node
EXPOSE 8080
CMD ["node", "server.mjs"]
