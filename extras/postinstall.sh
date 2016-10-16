#!/bin/bash

if [ "$(id -u)" != "0" ]; then
  echo "Not installed as root, not installing init script"
  exit 0;
fi

# Install the init file
echo "Installing init script at /etc/systemd/system/magic-mirror.service"
cp magic-mirror.service /etc/systemd/system/magic-mirror.service
chown root:root /etc/systemd/system/magic-mirror.service
chmod 755 /etc/systemd/system/magic-mirror.service

# Install the config file
echo "Installing config file at /etc/default/magic-mirror"
cp ../config.example.js /etc/default/magic-mirror
chown root:root /etc/default/magic-mirror
chmod 600 /etc/default/magic-mirror

# Start the service
systemctl enable magic-mirror
systemctl start magic-mirror
