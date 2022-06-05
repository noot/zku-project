#!/bin/bash

CIRCUIT="main"

cd circuits

if [ -f ./build/powersOfTau28_hez_final_10.ptau ]; then
    echo "powersOfTau28_hez_final_10.ptau already exists. Skipping."
else
    echo 'Downloading powersOfTau28_hez_final_10.ptau'
    wget https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_10.ptau
    mv powersOfTau28_hez_final_10.ptau build/
fi

echo "Compiling ${CIRCUIT}.circom..."

# compile circuit
mkdir build

circom ${CIRCUIT}.circom --r1cs --wasm --sym -o ./build
snarkjs r1cs info build/${CIRCUIT}.r1cs

# Start a new zkey and make a contribution

snarkjs groth16 setup build/${CIRCUIT}.r1cs build/powersOfTau28_hez_final_10.ptau build/circuit_0000.zkey
snarkjs zkey contribute build/circuit_0000.zkey build/circuit_final.zkey --name="1st Contributor Name" -v -e="random text"
snarkjs zkey export verificationkey build/circuit_final.zkey build/verification_key.json

# generate solidity contract
snarkjs zkey export solidityverifier build/circuit_final.zkey ../contracts/MerkleTreeVerifier.sol

cd ..