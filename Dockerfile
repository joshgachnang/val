FROM node:8 as builder

RUN apt-get -y update
RUN npm install -g typescript
WORKDIR /opt
COPY package.json /opt
RUN npm install
COPY . /opt
RUN tsc


FROM node:8

RUN mkdir /opt/dist
COPY --from=builder /opt/dist /opt/dist

WORKDIR /opt
COPY . /opt

# Install app dependencies
RUN npm install --production

EXPOSE 8080
CMD node dist/server.js
