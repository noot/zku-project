#!/bin/bash

# TODO: pull circuit_final.zkey
ganache-cli -d &> ganache.log &
cd ui

if [ -f ./public/circuit_final.zkey ]; then
    echo "circuit_final.zkey already exists. Skipping."
else
    echo 'Downloading circuit_final.zkey'
    cd public
    wget https://cf-templates-c6c45avhvbeb-ca-central-1.s3.ca-central-1.amazonaws.com/circuit_final.zkey
    cd ..
fi

npm i
yarn compile
yarn deploy 
yarn dev
cd ..