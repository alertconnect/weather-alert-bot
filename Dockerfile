FROM node:20.14.0-slim

# Set the NODE_ENV to production
ENV NODE_ENV production
ENV TZ Europe/Rome

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn --frozen-lockfile

COPY . .

CMD [ "yarn", "start:docker" ]
