FROM node:argon

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

EXPOSE 8443

VOLUME [ "/usr/src/app/config" ]
VOLUME [ "/usr/src/app/uploads" ]

CMD [ "npm", "start" ]
