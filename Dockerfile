FROM node:20-alpine

RUN apk add --no-cache bash python3 make g++ git


WORKDIR /app

COPY package*.json ./


RUN npm install --legacy-peer-deps

COPY . .

EXPOSE 4200

CMD ["npm", "start"]
