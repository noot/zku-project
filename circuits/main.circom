pragma circom 2.0.0;

include "./MerkleTree.circom";
include "./PublicKey.circom";

template FullProof(levels, size) {
	component tree = CheckRoot(levels);
	component privtoaddr = PublicKey();

	// signal input privkey;
	// signal input idx;
	// signal input addrs[size];
	// signal output root;

	// for(var i=0; i<size; i++) {
	// 	tree.leaves[i] <== addrs[i];
	// }

	// root <== tree.root;

	// privtoaddr.privkey <== privkey;
	// addrs[idx] === privtoaddr.addr;
}

component main = FullProof(3, 8);