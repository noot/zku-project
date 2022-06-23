#!/bin/bash

CIRCUIT="main"

cd circuits
echo "Compiling ${CIRCUIT}.circom..."

# compile circuit
mkdir build

circom ${CIRCUIT}.circom --r1cs --wasm --sym -o ./build
snarkjs r1cs info build/${CIRCUIT}.r1cs

if [ -f ./build/pot12_final.ptau ]; then
    echo "pot12_final.ptau already exists. Skipping."
else
    snarkjs powersoftau new bn128 23 build/pot12_0000.ptau -v
    snarkjs powersoftau contribute build/pot12_0000.ptau build/pot12_0001.ptau --name="First contribution" -v
    snarkjs powersoftau verify build/pot12_0001.ptau
    snarkjs powersoftau beacon build/pot12_0001.ptau build/pot12_beacon.ptau 0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f 10 -n="Final Beacon"
    snarkjs powersoftau prepare phase2 build/pot12_beacon.ptau build/pot12_final.ptau 
    snarkjs powersoftau verify build/pot12_final.ptau
fi

snarkjs groth16 setup build/${CIRCUIT}.r1cs build/pot12_final.ptau build/circuit_0000.zkey
snarkjs zkey contribute build/circuit_0000.zkey build/circuit_final.zkey --name="1st Contributor Name" -v -e="random text"
snarkjs zkey export verificationkey build/circuit_final.zkey build/verification_key.json

# generate solidity contract
snarkjs zkey export solidityverifier build/circuit_final.zkey ../contracts/Verifier.sol

# snarkjs plonk setup build/${CIRCUIT}.r1cs build/pot12_final.ptau build/circuit_final_plonk.zkey
# snarkjs zkey export verificationkey build/circuit_final_plonk.zkey build/verification_key.json
# snarkjs zkey export solidityverifier build/circuit_final_plonk.zkey ../contracts/Verifier.sol

cd ..