pragma circom 2.0.0;

include "./MerkleTree.circom";
//include "./Address.circom";

include "../circom-ecdsa/circuits/ecdsa.circom";
include "../circom-ecdsa/circuits/eth_addr.circom";
include "../circom-ecdsa/circuits/zk-identity/eth.circom";

template FullProof(levels) {
	var n = 64;
	var k = 4;

	// check signature
	component verifier = ECDSAVerifyNoPubkeyCheck(n, k);
	signal input r[k];
	signal input s[k];
	signal input msghash[k];
	signal input pubkey[2][k];
	signal output sigresult;

	for(var i=0; i<k; i++) {
		verifier.r[i] <== r[i];
		verifier.s[i] <== s[i];
		verifier.msghash[i] <== msghash[i];
		verifier.pubkey[0][i] <== pubkey[0][i];
		verifier.pubkey[1][i] <== pubkey[1][i];
	}

	sigresult <== verifier.result;

	// check inclusion proof
	component tree = MerkleTreeInclusionProof(levels);
	signal input leaf; // should equal address of pubkey above
    signal input path_elements[levels];
    signal input path_index[levels]; // path index are 0's and 1's indicating whether the current element is on the left or right
    signal output root; 

    tree.leaf <== leaf;
    for(var i=0; i<levels; i++) {
    	tree.path_elements[i] <== path_elements[i];
    	tree.path_index[i] <== path_index[i];
    }

    root <== tree.root;

    // check that leaf == address of pubkey
   component flattenPub = FlattenPubkey(n, k);
    for (var i = 0; i < k; i++) {
        flattenPub.chunkedPubkey[0][i] <== pubkey[0][i];
        flattenPub.chunkedPubkey[1][i] <== pubkey[1][i];
    }

    component pubToAddr = PubkeyToAddress();
    for (var i = 0; i < 512; i++) {
        pubToAddr.pubkeyBits[i] <== flattenPub.pubkeyBits[i];
    }

    pubToAddr.address === leaf;

	//component tree = CheckRoot(levels);
	//component privtoaddr = PublicKey();

	// signal input addrs[size];
	// signal output root;
	// signal output addr;

	// for(var i=0; i<size; i++) {
	// 	tree.leaves[i] <== addrs[i];
	// }

	// root <== tree.root;

	// for(var i=0; i<4; i++) {
	// 	privtoaddr.privkey[i] <== privkey[i];		
	// }

	// // TODO: can remove this line
	// addr <== privtoaddr.addr;
	// addrs[idx] === addr;
}

component main = FullProof(3);