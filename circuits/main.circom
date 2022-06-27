pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/poseidon.circom";

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

	for(var i=0; i<k; i++) {
		verifier.r[i] <== r[i];
		verifier.s[i] <== s[i];
		verifier.msghash[i] <== msghash[i];
		verifier.pubkey[0][i] <== pubkey[0][i];
		verifier.pubkey[1][i] <== pubkey[1][i];
	}

	// confirm signature is ok
	verifier.result === 1;

	// check inclusion proof
	component tree = MerkleTreeInclusionProof(levels);
	signal input leaf; // should equal address of pubkey above
    signal input path_elements[levels];
    signal input path_index[levels]; 
    signal output root; // TODO: accept expected root as input?

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

    // address generated from public key of signature
    signal output address;
    address <== pubToAddr.address;

    // hashed address should match input leaf
    signal output leafout;
    component hasher = Poseidon(1);
    hasher.inputs[0] <== address;
    leafout <== hasher.out;

    //leafout === leaf; 
}

component main = FullProof(3);