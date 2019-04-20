FROM jtbaird/alpine-node-mongo:latest

WORKDIR /usr/src/app

COPY package.json ./package.json

RUN npm install

COPY . .

CMD ["npm", "test"]
