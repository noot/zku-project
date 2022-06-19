const { ethers } = require("ethers");

// gets `num` accounts with at least `bal` balance (in ether)
async function getAccountsWithMinBalance(provider, num, bal) {
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

const apiKey = "ec83fd2ff717430b9defe56e70aa72d8";
let provider = new ethers.providers.InfuraProvider( "goerli", apiKey );
getAccountsWithMinBalance(provider, 2, 10).then(
	accounts => {
		console.log(accounts);
	}
);