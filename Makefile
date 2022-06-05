.PHONY: test build

test:

build:
	git submodule update --init
	cd circom-ecdsa 
	npm i
	cd ..
	bash scripts/compile.sh