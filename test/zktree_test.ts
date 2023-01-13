import * as fs from 'fs'
import * as snarkjs from 'snarkjs'
import { assert } from "chai";
import { ethers } from "hardhat";
import { buildMimcSponge, mimcSpongecontract } from 'circomlibjs'
import { Verifier, ZKTreeTest } from "../typechain-types";
import { PromiseOrValue } from "../typechain-types/common";
import { BigNumberish } from "ethers";
import { generateZeros, calculateMerkleRootAndPath, checkMerkleProof, generateCommitment, calculateMerkleRootAndPathFromEvents, getVerifierWASM } from '../src/zktree'

const SEED = "mimcsponge";
const TREE_LEVELS = 10;

function convertCallData(calldata) {
    const argv = calldata
        .replace(/["[\]\s]/g, "")
        .split(",")
        .map((x) => ethers.BigNumber.from(x).toString());

    const a = [argv[0], argv[1]] as [PromiseOrValue<BigNumberish>, PromiseOrValue<BigNumberish>];
    const b = [
        [argv[2], argv[3]],
        [argv[4], argv[5]],
    ] as [
            [PromiseOrValue<BigNumberish>, PromiseOrValue<BigNumberish>],
            [PromiseOrValue<BigNumberish>, PromiseOrValue<BigNumberish>]
        ];
    const c = [argv[6], argv[7]] as [PromiseOrValue<BigNumberish>, PromiseOrValue<BigNumberish>];
    const input = [argv[8], argv[9]] as [PromiseOrValue<BigNumberish>, PromiseOrValue<BigNumberish>];

    return { a, b, c, input };
}

describe("ZKTree Smart contract test", () => {

    let zktreetest: ZKTreeTest
    let verifier: Verifier
    let mimc: any
    let mimcsponge: any

    before(async () => {
        const signers = await ethers.getSigners()
        const MiMCSponge = new ethers.ContractFactory(mimcSpongecontract.abi, mimcSpongecontract.createCode(SEED, 220), signers[0])
        mimcsponge = await MiMCSponge.deploy()
        const ZKTreeTest = await ethers.getContractFactory("ZKTreeTest");
        const Verifier = await ethers.getContractFactory("Verifier");
        verifier = await Verifier.deploy();
        zktreetest = await ZKTreeTest.deploy(TREE_LEVELS, mimcsponge.address, verifier.address);
        mimc = await buildMimcSponge();
    });

    it("Testing the verifier circuit", async () => {
        const commitment = generateCommitment(mimc)
        // console.log(commitment)

        const rootAndPath = calculateMerkleRootAndPath(mimc, 20, [1, 2, 3, commitment.commitment], commitment.commitment)
        // console.log(rootAndPath)

        const { proof, publicSignals } = await snarkjs.groth16.fullProve(
            {
                nullifier: commitment.nullifier, secret: commitment.secret,
                pathElements: rootAndPath.pathElements, pathIndices: rootAndPath.pathIndices
            },
            getVerifierWASM(),
            "build/Verifier.zkey");

        assert.equal(publicSignals[0], commitment.nullifierHash)
        assert.equal(publicSignals[1], rootAndPath.root)

        const vKey = JSON.parse(fs.readFileSync("build/Verifier_vkey.json").toString());
        const res = await snarkjs.groth16.verify(vKey, publicSignals, proof);
        assert(res)

        const cd = convertCallData(await snarkjs.groth16.exportSolidityCallData(proof, publicSignals));
        // console.log(cd);

        const verifyRes = await verifier.verifyProof(cd.a, cd.b, cd.c, cd.input);
        // console.log(verifyRes)
        assert(verifyRes)
    })

    it("Should calculate the root and proof correctly with circuit", async () => {
        const res = calculateMerkleRootAndPath(mimc, TREE_LEVELS, [1, 2, 3], 3)
        // console.log(res)

        const { proof, publicSignals } = await snarkjs.groth16.fullProve(
            { leaf: 3, pathElements: res.pathElements, pathIndices: res.pathIndices },
            "build/MerkleTreeCheckerTest_js/MerkleTreeCheckerTest.wasm",
            "build/MerkleTreeCheckerTest.zkey");

        assert.equal(publicSignals[0], res.root.toString())
    })

    it("Should calculate commitment and nullifier hash correctly", async () => {
        const res = generateCommitment(mimc)
        // console.log(res)

        const { proof, publicSignals } = await snarkjs.groth16.fullProve(
            { nullifier: res.nullifier, secret: res.secret },
            "build/CommitmentHasherTest_js/CommitmentHasherTest.wasm",
            "build/CommitmentHasherTest.zkey");
        // console.log(publicSignals);
        // console.log(proof);
        // const nullifierHash = mimc.multiHash(['279742864192120152402769672173186917067247772449048476805227349133425435019']);
        // console.log(mimc.F.toString(nullifierHash))
        // const commitmentHash = mimc.multiHash(['279742864192120152402769672173186917067247772449048476805227349133425435019', '52772363489191471191688474459043598250377921094746635281870655152385669130']);
        // console.log(mimc.F.toString(commitmentHash))
        assert.equal(publicSignals[0], res.commitment)
        assert.equal(publicSignals[1], res.nullifierHash)
    })

    it("Should calculate the mimc correctly", async () => {
        const res = await mimcsponge["MiMCSponge"](1, 2, 3);
        //console.log(res.xL.toString())
        //console.log(res.xR.toString())
        const res2 = mimc.hash(1, 2, 3);
        //console.log(mimc.F.toString(res2.xL))
        //console.log(mimc.F.toString(res2.xR))
        assert.equal(res.xL.toString(), mimc.F.toString(res2.xL));
        assert.equal(res.xR.toString(), mimc.F.toString(res2.xR));
    })


    it('Should generate zeros correctly', async () => {
        const zeros = generateZeros(mimc, TREE_LEVELS)
        //console.log(ethers.BigNumber.from(zeros[0]).toHexString())
        //console.log(ethers.BigNumber.from(zeros[1]).toHexString())
        //console.log(ethers.BigNumber.from(zeros[2]).toHexString())
        //console.log(ethers.BigNumber.from(zeros[3]).toHexString())

        assert.equal(ethers.BigNumber.from(zeros[0]).toHexString(), '0x2fe54c60d3acabf3343a35b6eba15db4821b340f76e741e2249685ed4899af6c')
        assert.equal(ethers.BigNumber.from(zeros[1]).toHexString(), '0x256a6135777eee2fd26f54b8b7037a25439d5235caee224154186d2b8a52e31d')
        assert.equal(ethers.BigNumber.from(zeros[2]).toHexString(), '0x1151949895e82ab19924de92c40a3d6f7bcb60d92b00504b8199613683f0c200')
        assert.equal(ethers.BigNumber.from(zeros[3]).toHexString(), '0x20121ee811489ff8d61f09fb89e313f14959a0f28bb428a20dba6b0b068b3bdb')
    })

    it("Should calculate hash correctly", async () => {
        const zero = ethers.BigNumber.from('21663839004416932945382355908790599225266501822907911457504978515578255421292')

        const res = await zktreetest.hashLeftRight(zero, zero);
        //console.log(res)

        const res2 = mimc.multiHash([zero, zero]);
        //console.log(ethers.BigNumber.from(mimc.F.toString(res2)).toHexString());

        assert.equal(res, ethers.BigNumber.from(mimc.F.toString(res2)).toHexString());
    })

    it("Should calculate the root correctly", async () => {
        const res = await zktreetest.getLastRoot();
        // console.log(ethers.BigNumber.from(res).toHexString())

        const res2 = calculateMerkleRootAndPath(mimc, TREE_LEVELS, [])
        // console.log(ethers.BigNumber.from(res2).toHexString())

        assert.equal(ethers.BigNumber.from(res).toHexString(), ethers.BigNumber.from(res2.root).toHexString());
    })


    it("Should calculate the root correctly after commit 1.", async () => {
        await zktreetest.commit(1);

        const res = await zktreetest.getLastRoot();
        // console.log(ethers.BigNumber.from(res).toHexString())

        const res2 = calculateMerkleRootAndPath(mimc, TREE_LEVELS, [1], 1)
        // console.log(res2)

        assert.equal(ethers.BigNumber.from(res).toHexString(), ethers.BigNumber.from(res2.root).toHexString());
    })

    it("Should calculate the root correctly after commit 2.", async () => {
        await zktreetest.commit(2);

        const res = await zktreetest.getLastRoot();
        // console.log(ethers.BigNumber.from(res).toHexString())

        const res2 = calculateMerkleRootAndPath(mimc, TREE_LEVELS, [1, 2], 2)
        // console.log(res2)

        assert.equal(ethers.BigNumber.from(res).toHexString(), ethers.BigNumber.from(res2.root).toHexString());
    })

    it("Should calculate the root and proof correctly after commit 3.", async () => {
        await zktreetest.commit(3);

        const res = await zktreetest.getLastRoot();
        // console.log(ethers.BigNumber.from(res).toHexString())

        const res2 = calculateMerkleRootAndPath(mimc, TREE_LEVELS, [1, 2, 3], 3)
        const root = checkMerkleProof(mimc, TREE_LEVELS, res2.pathElements, res2.pathIndices, 3)

        assert.equal(ethers.BigNumber.from(res).toHexString(), ethers.BigNumber.from(res2.root).toHexString());
        assert.equal(ethers.BigNumber.from(res).toHexString(), ethers.BigNumber.from(root).toHexString());
    })

    it("Should calculate the root and proof correctly from events", async () => {
        const signers = await ethers.getSigners()
        const res = await zktreetest.getLastRoot();
        const res2 = await calculateMerkleRootAndPathFromEvents(mimc, zktreetest.address, signers[0], TREE_LEVELS, 3)
        const root = checkMerkleProof(mimc, TREE_LEVELS, res2.pathElements, res2.pathIndices, 3)

        assert.equal(ethers.BigNumber.from(res).toHexString(), ethers.BigNumber.from(res2.root).toHexString());
        assert.equal(ethers.BigNumber.from(res).toHexString(), ethers.BigNumber.from(root).toHexString());
    })

    it("Testing the full process", async () => {
        const signers = await ethers.getSigners()
        const commitment = generateCommitment(mimc)
        await zktreetest.commit(commitment.commitment)
        const proof = await calculateMerkleRootAndPathFromEvents(mimc, zktreetest.address, signers[0], TREE_LEVELS, commitment.commitment)

    })

})