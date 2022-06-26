#!/bin/bash

# TODO: pull circuit_final.zkey
ganache-cli -d &> ganache.log &
cd ui
yarn compile
yarn deploy 
yarn dev
cd ..