FROM node:15.0.1-alpine3.12

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package.json .
COPY yarn.lock .
COPY .npmrc .

ARG GITHUB_PKG_TOKEN
RUN echo "//npm.pkg.github.com/:_authToken=\${GITHUB_PKG_TOKEN}" >> .npmrc && \
    yarn --frozen-lockfile

# Bundle app source
COPY . .

CMD [ "yarn", "start:docker" ]
