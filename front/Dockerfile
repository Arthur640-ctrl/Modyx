FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

ENV NODE_ENV=production
ENV NEXT_PUBLIC_API_URL=https://api.modyx.gleeze.com

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]
