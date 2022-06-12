pragma circom 2.0.0;

include "./MerkleTree.circom";
include "./Address.circom";

template FullProof(levels, idx) {
	var size = 2**levels;

	component tree = CheckRoot(levels);
	component privtoaddr = PublicKey();

	signal input privkey[4];
	signal input addrs[size];
	signal output root;
	signal output addr;

	for(var i=0; i<size; i++) {
		tree.leaves[i] <== addrs[i];
	}

	root <== tree.root;

	for(var i=0; i<4; i++) {
		privtoaddr.privkey[i] <== privkey[i];		
	}

	addr <== privtoaddr.addr;

	//addrs[idx] === privtoaddr.addr;
}

component main = FullProof(3, 0);