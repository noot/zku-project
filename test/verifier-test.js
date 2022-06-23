const { expect } = require("chai");
const { ethers } = require("hardhat");
const { groth16 } = require("snarkjs");
const circom_tester = require('circom_tester');
const wasm_tester = circom_tester.wasm;
const path = require("path");
const assert = require('node:assert');
const { getPublicKey, sign, Point } = require('@noble/secp256k1');

const buildPoseidon = require("circomlibjs").buildPoseidon;

async function merkleTree(levels, leaves) {
  // TODO: check leaves is power of 2 and is an array
  let poseidon = await buildPoseidon();

  // hash leaves
  let tree = [];
  let level = [];
  for (let i=0; i<leaves.length; i++) {
    let hash = poseidon([leaves[i]]);
    level.push(hash);
  }
  tree.push(level);

  for (let i=0; i<levels; i++) {
    let level = [];
    for (let j=0; j<tree[i].length; j+=2) {
      let hash = poseidon(tree[i][j], tree[i][j+1]);
      level.push(hash);
    }
    assert(level.length * 2 == tree[i].length);
    tree.push(level);
  }
  assert(tree[levels].length == 1);
  return tree
}

function getProof(tree, hashedLeaf) {
  // TODO
}

function scalarToBigIntArray(s) {
  assert(s.length == 32);

  return [
      bufToBn(s.slice(24,32)),
      bufToBn(s.slice(16,24)), 
      bufToBn(s.slice(8,16)), 
      bufToBn(s.slice(0,8)), 
    ]
}

describe("Verifier", function () {
  this.timeout(1000000);

  it("should generate a proof", async function() {
    let poseidon = await buildPoseidon();

    const Verifier = await ethers.getContractFactory("Verifier");
    const verifier = await Verifier.deploy();
    await verifier.deployed();

    const addrs = [
      "0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1",
      "0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0",
      "0x22d491Bde2303f2f43325b2108D26f1eAbA1e32b",
      "0xE11BA2b4D45Eaed5996Cd0823791E0C93114882d",
      "0xd03ea8624C8C5987235048901fB614fDcA89b117",
      "0x95cED938F7991cd0dFcb48F0a06a40FA1aF46EBC",
      "0x3E5e9111Ae8eB78Fe1CC3bb8915d5D461F3Ef9A9",
      "0x28a8746e75304c0780E011BEd21C72cD78cd535E",
    ]

    let leaf = bufToBn(poseidon([ethers.utils.arrayify(addrs[0])]));
    console.log("leaf")
    console.log(leaf);

    let tree = await merkleTree(3, addrs);
    console.log(tree);

    // ganache-cli -d key 0
    const privkey = ethers.utils.arrayify("0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d")
    // const privkeyTuple = [
    //   bufToBn(privkey.slice(24,32)),
    //   bufToBn(privkey.slice(16,24)), 
    //   bufToBn(privkey.slice(8,16)), 
    //   bufToBn(privkey.slice(0,8)), 
    // ]
    // console.log(bufToBn(privkey.slice(0,8)))

    let pubkey = Point.fromPrivateKey(privkey);
    let msg = 1234n;
    let msghash = poseidon([bnToBuf(msg)]);
    //test_cases.push([privkeys[idx], msghash_bigint, pubkey.x, pubkey.y]);

    let sig = await sign(msghash, 
      privkey, {canonical: true, der: false});

    const { proof, publicSignals } = await groth16.fullProve({
      "r": scalarToBigIntArray(sig.slice(0, 32)),
      "s": scalarToBigIntArray(sig.slice(32, 64)),
      "msghash": scalarToBigIntArray(msghash),
      "pubkey": [scalarToBigIntArray(bnToBuf(pubkey.x)), scalarToBigIntArray(bnToBuf(pubkey.y))],
      "leaf": leaf,
      "path_elements": [bufToBn(tree[0][1]), bufToBn(tree[1][1]), bufToBn(tree[2][1])], // TODO
      "path_index": [1n, 1n, 1n], // TODO
    }, 
    "circuits/build/main_js/main.wasm","circuits/build/circuit_final.zkey");

    console.log(publicSignals);
    console.log(bnToBuf(publicSignals[0])); // sigresult
    console.log(bnToBuf(publicSignals[1])); // root
  })


  it("should verify a valid proof", async function () {
    const Verifier = await ethers.getContractFactory("PlonkVerifier");
    const verifier = await Verifier.deploy();
    await verifier.deployed();

    // ganache-cli -d key 0
    const privkey = ethers.utils.arrayify("0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d")
    const privkeyTuple = [
      bufToBn(privkey.slice(24,32)),
      bufToBn(privkey.slice(16,24)), 
      bufToBn(privkey.slice(8,16)), 
      bufToBn(privkey.slice(0,8)), 
    ]
    //console.log(bufToBn(privkey.slice(0,8)))

    const addrs = [
      "0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1",
      "0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0",
      "0x22d491Bde2303f2f43325b2108D26f1eAbA1e32b",
      "0xE11BA2b4D45Eaed5996Cd0823791E0C93114882d",
      "0xd03ea8624C8C5987235048901fB614fDcA89b117",
      "0x95cED938F7991cd0dFcb48F0a06a40FA1aF46EBC",
      "0x3E5e9111Ae8eB78Fe1CC3bb8915d5D461F3Ef9A9",
      "0x28a8746e75304c0780E011BEd21C72cD78cd535E",
    ]

    const { proof, publicSignals } = await plonk.fullProve({
      "privkey":privkeyTuple,
      "addrs": addrs,
    }, 
    "circuits/build/main_js/main.wasm","circuits/build/circuit_final_plonk.zkey");

    console.log(publicSignals);
    console.log(bnToBuf(publicSignals[0])); // root
    console.log(bnToBuf(publicSignals[1])); // address
  });
});

function bnToBuf(bn) {
  var hex = BigInt(bn).toString(16);
  if (hex.length % 2) { hex = '0' + hex; }

  var len = hex.length / 2;
  var u8 = new Uint8Array(len);

  var i = 0;
  var j = 0;
  while (i < len) {
    u8[i] = parseInt(hex.slice(j, j+2), 16);
    i += 1;
    j += 2;
  }

  return u8;
}

function bufToBn(u8) {
  var hex = [];
  //u8 = Uint8Array.from(buf);

  u8.forEach(function (i) {
    var h = i.toString(16);
    if (h.length % 2) { h = '0' + h; }
    hex.push(h);
  });

  return BigInt('0x' + hex.join(''));
}