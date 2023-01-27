FROM node:16-alpine

WORKDIR /usr/src/app

COPY package*.json ./
COPY yarn.lock ./

RUN yarn

COPY . .

RUN yarn build:web

EXPOSE 3000

CMD ["node", "dist/ssr/index.js"]
