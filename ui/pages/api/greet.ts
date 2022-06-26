import Verifier from "artifacts/contracts/Verifier.sol/Verifier.json"
import { Contract, providers, utils } from "ethers"
import type { NextApiRequest, NextApiResponse } from "next"
const { groth16 } = require("snarkjs");

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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { proof, publicSignals } = JSON.parse(req.body)

    const contract = new Contract("0x5FbDB2315678afecb367f032d93F642f64180aa3", Verifier.abi)
    const provider = new providers.JsonRpcProvider("http://localhost:8545")

    const contractOwner = contract.connect(provider.getSigner())

    const editedPublicSignals = unstringifyBigInts(publicSignals);
    const editedProof = unstringifyBigInts(proof);
    const calldata = await groth16.exportSolidityCallData(editedProof, editedPublicSignals);

    const argv = calldata.replace(/["[\]\s]/g, "").split(',').map(x => BigInt(x).toString());

    const a = [argv[0], argv[1]];
    const b = [[argv[2], argv[3]], [argv[4], argv[5]]];
    const c = [argv[6], argv[7]];
    const input = argv.slice(8);

    try {
        await contractOwner.verifyProof(a, b, c, input)
        res.status(200).end()
    } catch (error: any) {
        const { message } = JSON.parse(error.body).error
        const reason = message.substring(message.indexOf("'") + 1, message.lastIndexOf("'"))
        res.status(500).send(reason || "Unknown error!")
    }
}
