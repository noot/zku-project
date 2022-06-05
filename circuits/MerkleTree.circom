pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/poseidon.circom";

template CheckRoot(n) { // compute the root of a MerkleTree of n Levels 
    signal input leaves[2**n];
    signal output root;

    //[assignment] insert your code here to calculate the Merkle root from 2^n leaves
    component levelHasher[n];

    signal levels[n+1][2**n];
    for(var i=0; i<2**n; i++) {
        levels[0][i] <== leaves[i];    
    }

    for(var i=0; i<n; i++) {
        var numNodes = 2**(n-i);
        levelHasher[i] = HashMerkleTreeLevel(2**n, numNodes);
        for(var j=0; j<2**n; j++) {
            levelHasher[i].lower[j] <== levels[i][j];
        }
        for(var j=0; j<2**n; j++) {
            levels[i+1][j] <== levelHasher[i].upper[j];        
        }
    }

    root <== levels[n][0];
} 

template HashMerkleTreeLevel(n, actual) { // hash merkle tree level w/ n nodes, returns n/2 nodes
    // should actually check that n is a power of 2
    assert(n % 2 == 0);
    assert(actual % 2 == 0);
    assert(n >= actual);

    signal input lower[n];
    signal output upper[n];
    component hasher[actual];

    for(var i=0; i<actual; i+=2) {
        hasher[i] = HashTogether();
        hasher[i].preimages[0] <== lower[i];
        hasher[i].preimages[1] <== lower[i+1];
        upper[i/2] <== hasher[i].hash;
    }

    for(var i=actual/2; i<n; i++) {
        upper[i] <== 0;
    }
}

template HashTogether() {
    signal input preimages[2];
    signal output hash;

    component hasher = Poseidon(2);
    hasher.inputs[0] <== preimages[0];
    hasher.inputs[1] <== preimages[1];
    hash <== hasher.out;
}
 
template MerkleTreeInclusionProof(n) {
    signal input leaf;
    signal input path_elements[n];
    signal input path_index[n]; // path index are 0's and 1's indicating whether the current element is on the left or right
    signal output root; // note that this is an OUTPUT signal

    signal intermediates[n];
    component hasher[n];

    for (var i=0; i<n; i++) {
        var sibling;
        if (i==0) {
            sibling = leaf;
        }  else {
            sibling = intermediates[i-1];
        }

        hasher[i] = HashTogether();
    
        var isLeft = path_index[0] == 0;
        hasher[i].preimages[0] <-- isLeft? path_elements[i] : sibling;
        hasher[i].preimages[1] <-- isLeft? sibling : path_elements[i];

        intermediates[i] <== hasher[i].hash;
    }

    root <== intermediates[n-1];
}