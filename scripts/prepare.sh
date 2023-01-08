#!/usr/bin/env bash

mkdir -p build
wget https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_14.ptau -P ./build
circom test/circuits/CommitmentHasherTest.circom --wasm --r1cs -o ./build
npx snarkjs groth16 setup build/CommitmentHasherTest.r1cs build/powersOfTau28_hez_final_14.ptau build/CommitmentHasherTest.zkey
circom test/circuits/MerkleTreeCheckerTest.circom --wasm --r1cs -o ./build
npx snarkjs groth16 setup build/MerkleTreeCheckerTest.r1cs build/powersOfTau28_hez_final_14.ptau build/MerkleTreeCheckerTest.zkey
