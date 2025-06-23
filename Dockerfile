FROM node:alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY dist ./steam-idler-dist
COPY public ./public

RUN mkdir -p /app/data /app/logs

EXPOSE 3000

CMD ["node", "steam-idler-dist/main.js"]