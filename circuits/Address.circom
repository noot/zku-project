pragma circom 2.0.0;
 
include "../circom-ecdsa/circuits/eth_addr.circom";

template PublicKey() {
	component privtoaddr = PrivKeyToAddr(64, 4);

	signal input privkey[4];
	signal output addr;

	for(var i=0; i<4; i++) {
		privtoaddr.privkey[i] <== privkey[i];	
	}
	addr <== privtoaddr.addr;
}
