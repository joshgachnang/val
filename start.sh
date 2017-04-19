#! /bin/bash

set -x
set -e

echo "Fetching envfile.."
wget --no-check-certificate -O /usr/src/app/envfile "$CONFIG_URL"
cat /usr/src/app/envfile
echo "Building app.."
npm build
echo "Starting app.."
npm start

