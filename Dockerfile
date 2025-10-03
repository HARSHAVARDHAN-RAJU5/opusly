# Dockerfile (root) - for project where package.json lives in backend/
FROM node:18

WORKDIR /usr/src/app

# copy only package files from backend for proper npm cache
COPY backend/package*.json ./

# install dependencies
RUN npm install --production

# copy backend source
COPY backend/ ./

EXPOSE 5000

CMD ["node", "src/server.js"]
