#! /bin/bash

set -x
set -e

npm build
wget --no-check-certificate -O /usr/src/app/envfile "$CONFIG_URL"
npm start

