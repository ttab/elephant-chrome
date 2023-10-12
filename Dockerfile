FROM node:hydrogen
RUN apt-get update && apt-get upgrade -y
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY package.json package-lock.json tsconfig.json jest.config.ts /usr/src/app/
RUN npm ci
COPY . /usr/src/app
RUN npm run build
EXPOSE 5173
CMD [ "npm", "start" ]
