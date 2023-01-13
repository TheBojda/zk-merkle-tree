#!/usr/bin/env bash

mkdir -p build
wget https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_15.ptau -P ./build
circom test/circuits/CommitmentHasherTest.circom --wasm --r1cs -o ./build
npx snarkjs groth16 setup build/CommitmentHasherTest.r1cs build/powersOfTau28_hez_final_15.ptau build/CommitmentHasherTest.zkey
circom test/circuits/MerkleTreeCheckerTest.circom --wasm --r1cs -o ./build
npx snarkjs groth16 setup build/MerkleTreeCheckerTest.r1cs build/powersOfTau28_hez_final_15.ptau build/MerkleTreeCheckerTest.zkey
circom circuits/Verifier.circom --wasm --r1cs -o ./build
npx snarkjs groth16 setup build/Verifier.r1cs build/powersOfTau28_hez_final_15.ptau build/Verifier.zkey
npx snarkjs zkey export verificationkey build/Verifier.zkey build/Verifier_vkey.json
npx snarkjs zkey export solidityverifier build/Verifier.zkey contracts/Verifier.sol
sed -i -e 's/pragma solidity \^0.6.11/pragma solidity 0.8.17/g' contracts/Verifier.sol
npx wasm2js build/Verifier_js/Verifier.wasm -o src/Verifier.js
