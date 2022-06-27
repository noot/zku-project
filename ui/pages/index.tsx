import detectEthereumProvider from "@metamask/detect-provider"
// import { Strategy, ZkIdentity } from "@zk-kit/identity"
// import { generateMerkleProof, Semaphore } from "@zk-kit/protocols"
import ethers from "ethers";
import { providers, utils, Contract, ContractFactory } from "ethers"
import Head from "next/head"
import React from "react"
import styles from "../styles/Home.module.css"
import { useForm } from "react-hook-form";
import { object, string, number, date, InferType } from 'yup';
import Verifier from "../artifacts/contracts/Verifier.sol/Verifier.json"

import { poseidon } from "circomlibjs";
import getAccountsWithMinBalance from "../src/generate.js";
const { groth16 } = require("snarkjs");

let userSchema = object({ 
  amount: number().required().positive().integer(),
})

function scalarToBigIntArray(s) {
  return [
      bufToBn(s.slice(24,32)),
      bufToBn(s.slice(16,24)), 
      bufToBn(s.slice(8,16)), 
      bufToBn(s.slice(0,8)), 
    ]
}

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

async function merkleTree(levels, leaves) {
  // TODO: check leaves is power of 2 and is an array

  // hash leaves
  let tree = [];
  let level = [];
  for (let i=0; i<leaves.length; i++) {
    let hash = poseidon([bufToBn(utils.arrayify(leaves[i]))]);
    level.push(hash);
  }
  tree.push(level);

  for (let i=0; i<levels; i++) {
    let level = [];
    for (let j=0; j<tree[i].length; j+=2) {
      let hash = poseidon([tree[i][j], tree[i][j+1]]);
      level.push(hash);
    }
    tree.push(level);
  }
  return tree
}

function getProof(tree, hashedLeaf) {
  // TODO
}

async function generateProof(sig, msghash, pubkey, addrs) {
    let tree = await merkleTree(3, addrs);
    let leaf = tree[0][0];

    let pubkeyX = pubkey.slice(1, 33);
    let pubkeyY = pubkey.slice(33, 65);

    const { proof, publicSignals } = await groth16.fullProve({
      "r": scalarToBigIntArray(sig.slice(0, 32)),
      "s": scalarToBigIntArray(sig.slice(32, 64)),
      "msghash": scalarToBigIntArray(msghash),
      "pubkey": [scalarToBigIntArray(pubkeyX), scalarToBigIntArray(pubkeyY)],
      "leaf": leaf,
      "path_elements": [tree[0][1], tree[1][1], tree[2][1]], // TODO
      "path_index": [1n, 1n, 1n], // TODO
    }, 
    "./main.wasm","./circuit_final.zkey");

    return {proof, publicSignals}
}

function mapToList(m) {
    let list = [];
    Object.keys(m).forEach((key) => {
        list.push(key)
    })
    return list
}

function unstringifyBigInts(o) {
    if ((typeof(o) == "string") && (/^[0-9]+$/.test(o) ))  {
        return BigInt(o);
    } else if ((typeof(o) == "string") && (/^0x[0-9a-fA-F]+$/.test(o) ))  {
        return BigInt(o);
    } else if (Array.isArray(o)) {
        return o.map(unstringifyBigInts);
    } else if (typeof o == "object") {
        if (o===null) return null;
        const res = {};
        const keys = Object.keys(o);
        keys.forEach( (k) => {
            res[k] = unstringifyBigInts(o[k]);
        });
        return res;
    } else {
        return o;
    }
}

async function verifyProof(proof, publicSignals, provider) {
    //let contractAddr = "0x5FbDB2315678afecb367f032d93F642f64180aa3" // TODO: this is for dev
    let contract = new Contract(contractAddr, Verifier.abi)
    contract = contract.connect(provider);

    // let code = await provider.getCode(contractAddr);
    // console.log(code)

    const editedPublicSignals = unstringifyBigInts(publicSignals);
    const editedProof = unstringifyBigInts(proof);
    const calldata = await groth16.exportSolidityCallData(editedProof, editedPublicSignals);

    const argv = calldata.replace(/["[\]\s]/g, "").split(',').map(x => BigInt(x).toString());

    const a = [argv[0], argv[1]];
    const b = [[argv[2], argv[3]], [argv[4], argv[5]]];
    const c = [argv[6], argv[7]];
    const input = argv.slice(8);

    return await contract.verifyProof(a, b, c, input);
}

let contractAddr;

export default function Home() {
    const [logs, setLogs] = React.useState("Connect your wallet!")
   // const [logs2, setLogs2] = React.useState("Greeting: ")

    const { register, handleSubmit, watch, formState: { errors } } = useForm();
    const onSubmit = async function (data) {
        const validatedData = await userSchema.validate(data);
        console.log(validatedData);

        setLogs(`creating proof of funds (${validatedData.amount} ETH)...`)
        const provider = (await detectEthereumProvider()) as any
        await provider.request({ method: "eth_requestAccounts" })

        const ethersProvider = new providers.Web3Provider(provider)
        const signer = ethersProvider.getSigner()

        // let contractAddr = "0x5FbDB2315678afecb367f032d93F642f64180aa3" // TODO: this is for dev
        // let code = await ethersProvider.getCode(contractAddr);
        // console.log(code)

        //const msg = "Sign this message to prove account ownership";

        let msghash = await poseidon([1234n]); // arbitrary hash
        console.log(msghash)
        const signature = await signer.signMessage(msghash);
        console.log(signature)
        let pubkey = await utils.recoverPublicKey(bnToBuf(msghash), signature);
        console.log(pubkey)

        setLogs(`gathering anonymity set of accounts with at least ${validatedData.amount} ETH...`);
        // TODO: get set
        let addrs = await getAccountsWithMinBalance(ethersProvider, 7, validatedData.amount);
        console.log(addrs)

        // TODO: randomize location of addr in tree
        let addrList = mapToList(addrs).slice(0, 7);
        addrList.push(await signer.getAddress());
        console.log(addrList);
        setLogs(`got anonymity set, generating proof of funds (takes a few minutes)...`);

        let {proof, publicSignals} = await generateProof(utils.arrayify(signature), 
            bnToBuf(msghash), utils.arrayify(pubkey), addrList);

        setLogs("proof generated, verifying in contract...")

        let res = await verifyProof(proof, publicSignals, ethersProvider);
        setLogs(res)
    }

    const deploy = async function() {
        setLogs(`deploying Verifier contract...`);
        const provider = (await detectEthereumProvider()) as any
        await provider.request({ method: "eth_requestAccounts" })

        const ethersProvider = new providers.Web3Provider(provider)
        const signer = ethersProvider.getSigner()      

        const VerifierContract = new ContractFactory(Verifier.abi, Verifier.bytecode, signer)
        const verifier = await VerifierContract.deploy()
        await verifier.deployTransaction.wait()
        setLogs(`Verifier contract has been deployed to: ${verifier.address}`)

       let code = await ethersProvider.getCode(verifier.address);
        console.log(code)
        contractAddr = verifier.address;
    }

    return (
        <div className={styles.container}>
            <Head>
                <title>Proof-of-Funds</title>
                <meta name="description" content="Proof of Funds" />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <main className={styles.main}>
                <h1 className={styles.title}>Proof-of-Funds</h1>

                <p className={styles.description}>A simple ZK app to prove funds.</p>

                <div className={styles.logs}>{logs}</div>

                <form onSubmit={handleSubmit(onSubmit)}>
                  {/* register your input into the hook by invoking the "register" function */}
                  <input defaultValue="amount to prove" {...register("amount")} />

                  <input type="submit" value="prove funds!" />
                </form>

               <div onClick={() => deploy()} className={styles.button}>
                    deploy contract
                </div>
            </main>
        </div>
    )
}
