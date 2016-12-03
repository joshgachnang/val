FROM node:boron

RUN apt-get -y update && apt-get install nano && apt-get install 
# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json /usr/src/app/
RUN npm install --only=production && npm install -g bower

# Install app dependencies
COPY bower.json /usr/src/app/
RUN bower install --allow-root

# Install app
COPY . /usr/src/app

EXPOSE 8080

CMD [ "npm", "start" ]
