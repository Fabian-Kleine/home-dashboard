# !/bin/bash

printf "Installing dependencies...\n"

# This script is used to install the dependencies for the project. It is intended to be run on a Debian-based Linux distribution.
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl ca-certificates gnupg lsb-release build-essential

# install nginx
sudo apt install -y nginx
sudo systemctl enable --now nginx

# install nodejs
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.4/install.sh | bash

export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

nvm install --lts
nvm alias default lts/*

# firewall
sudo apt install -y ufw
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'   # opens 80/443
sudo ufw allow 5432/tcp
sudo ufw enable


printf "\n\nDependencies installed successfully!\n"
printf "Running checks...\n"

printf "\n\nChecking nginx status...\n"

sudo systemctl status nginx --no-pager

curl -I http://localhost

printf "\n\nChecking node and npm versions...\n"

node -v
npm -v

printf "\n\nChecking firewall status...\n"

sudo ufw status verbose