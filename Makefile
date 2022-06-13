.PHONY: test build

test:

build:
	git submodule update --init
	cd circom-ecdsa 
	yarn
	cd ..
	bash scripts/compile.sh