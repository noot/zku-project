# Proof-of-Funds

An application that allows a user to prove they had at least some amount of funds at a certain block.

## How it works

The zk component of this application creates a proof of inclusion within some set of addresses and that the prover owns the private key of one of these addresses.

On the verifier side, the verifier checks that these addresses have a certain balance and that the zk-proof is valid.

- circuits: contains `MerkleTree.circom` that creates a merkle tree of addresses and `Address.circom` that outputs an address given a private key. `main.circom` combines these two circuits and proves that a private key is known for some address in the merkle tree.
- contracts: `Verifier.sol` verifies the zk-proof. 
- backend: allows prover to easily find set of addresses to use in the set that have a certain balance.
- ui: allows users to easily generate and verify fund proofs.

This project could be generalized to prove membership in any set of accounts, for example a set of token owners.

## Instructions

Dependencies:
- circom 2.0
- npm / node.js

To install dependencies and build the circuits:
```bash
make build
```

To test:
```bash
npx hardhat test
```

## UI (development)

To run the UI locally, firstly import the following key (hardhat's first deterministic key) into MetaMask:
```
0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

Make sure MetaMask's network is set to `localhost:8545`.

Then, run the following script to build and deploy the contract and start the UI:
```bash
bash scripts/start-ui.sh
```

Then, go to `http://localhost:3000` to see the UI.

## UI (Goerli testnet)

Make sure MetaMask's network is set to Goerli and you have an account with some Goerli ETH in it (unless you want to prove you have 0 ETH!)

Then, run the following script to build and deploy the contract and start the UI:
```bash
bash scripts/start-ui.sh
```

Then, go to `http://localhost:3000` to see the UI.

## Applications

Proof-of-Funds has potential applications including, but not limited to:
- proof of ownership at a certain time
- privacy-preserving airdrop claims
- authentication, login, DAO access (if extended to tokens)
- proof of minimal capital (eg. loans)
- stablecoin collateralization proof

While many of these are currently doable, proof-of-funds allows them to be done in a privacy-preserving manner.