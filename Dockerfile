FROM node:boron

RUN apt-get -y update && apt-get install nano && apt-get install 
# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json /usr/src/app/
COPY node_modules/ /usr/src/app/node_modules/
RUN npm install -g bower typescript

# Install frontend dependencies
COPY bower.json /usr/src/app/
RUN bower install --allow-root

# Install and compile app
COPY ./ /usr/src/app

RUN tsc

EXPOSE 8080

CMD [ "npm", "build" ]

CMD [ "npm", "start" ]
