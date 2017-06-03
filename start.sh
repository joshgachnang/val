#! /bin/bash

set -x
set -e

if [ ! -z "$CONFIG_URL" ]; then
  echo "Fetching envfile.."
  wget --no-check-certificate -O /usr/src/app/envfile "$CONFIG_URL"
  cat /usr/src/app/envfile
else
  echo "No config URL, not attempting download";
fi
echo "Building app.."
npm run build
echo "Starting app.."
npm start

