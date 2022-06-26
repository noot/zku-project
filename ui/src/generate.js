const { ethers } = require("ethers");

const addrs = {
  "0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1": {},
  "0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0": {},
  "0x22d491Bde2303f2f43325b2108D26f1eAbA1e32b": {},
  "0xE11BA2b4D45Eaed5996Cd0823791E0C93114882d": {},
  "0xd03ea8624C8C5987235048901fB614fDcA89b117": {},
  "0x95cED938F7991cd0dFcb48F0a06a40FA1aF46EBC": {},
  "0x3E5e9111Ae8eB78Fe1CC3bb8915d5D461F3Ef9A9": {},
  "0x28a8746e75304c0780E011BEd21C72cD78cd535E": {},
}

// gets `num` accounts with at least `bal` balance (in ether)
export default async function getAccountsWithMinBalance(provider, num, bal) {
	let network = await provider.getNetwork();
	if (network.chainId == 1337) {
		return addrs;
	}

	bal = ethers.utils.parseUnits(bal.toString(), "ether");
	let accounts = {};
	let currBlock = await provider.getBlockNumber();

	while (Object.keys(accounts).length < num) {
		let block = await provider.getBlock(currBlock);

		block.transactions.forEach(async (hash) => {
			let tx = await provider.getTransaction(hash);
			let fromBal = await provider.getBalance(tx.from);
			if (fromBal > bal) {
				accounts[tx.from] = {};
			}

			if (tx.to == null) {
				return
			}

			let toBal = await provider.getBalance(tx.to);
			if (toBal > bal) {
				accounts[tx.to] = {};
			}
		})

		//console.log("accounts", accounts)
		currBlock--;
	}

	return accounts;
}
