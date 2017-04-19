FROM node:boron

RUN apt-get -y update && apt-get install nano && apt-get install 
# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
RUN npm install -g bower typescript
COPY package.json yarn.lock /usr/src/app/
RUN npm install -g -s --no-progress yarn && \
    yarn && \
    yarn cache clean

# Install and compile app
COPY ./ /usr/src/app

RUN tsc

EXPOSE 8080

CMD [ "bash", "start.sh" ]
