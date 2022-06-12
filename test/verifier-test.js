const { expect } = require("chai");
const { ethers } = require("hardhat");
const { plonk } = require("snarkjs");
const circom_tester = require('circom_tester');
const wasm_tester = circom_tester.wasm;
const path = require("path");

describe("Verifier", function () {
  this.timeout(1000000);

  it("should verify a valid proof", async function () {
    const Verifier = await ethers.getContractFactory("PlonkVerifier");
    const verifier = await Verifier.deploy();
    await verifier.deployed();

    // ganache-cli -d key 0
    const privkey = ethers.utils.arrayify("0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d")
    const privkeyTuple = [
      bufToBn(privkey.slice(0,8)), 
      bufToBn(privkey.slice(8,16)), 
      bufToBn(privkey.slice(16,24)), 
      bufToBn(privkey.slice(24,32)),
    ]
    console.log(bufToBn(privkey.slice(0,8)))

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
  });
});

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