import { assert } from "chai";
import { ethers } from "hardhat";
import { buildMimcSponge, mimcSpongecontract, buildPedersenHash } from 'circomlibjs'
import * as snarkjs from 'snarkjs'
import { ZKTreeTest } from "../typechain-types";
import { generateZeros, calculateMerkleRootAndPath, checkMerkleProof } from '../src/zktree'

const SEED = "mimcsponge";

describe("ZKTree Smart contract test", () => {

    let zktreetest: ZKTreeTest
    let mimc: any
    let mimcsponge: any

    before(async () => {
        const signers = await ethers.getSigners()
        const MiMCSponge = new ethers.ContractFactory(mimcSpongecontract.abi, mimcSpongecontract.createCode(SEED, 220), signers[0])
        mimcsponge = await MiMCSponge.deploy()
        const ZKTreeTest = await ethers.getContractFactory("ZKTreeTest");
        zktreetest = await ZKTreeTest.deploy(10, mimcsponge.address);
        mimc = await buildMimcSponge();
    });

    it("Should calculate the root and proof correctly with circuit", async () => {
        const res = calculateMerkleRootAndPath(mimc, 10, [1, 2, 3], 3)
        // console.log(res)

        const { proof, publicSignals } = await snarkjs.groth16.fullProve(
            { leaf: 3, pathElements: res.pathElements, pathIndices: res.pathIndices },
            "build/MerkleTreeCheckerTest_js/MerkleTreeCheckerTest.wasm",
            "build/MerkleTreeCheckerTest.zkey");

        assert.equal(publicSignals[0], res.root.toString())
    })

    it("Should calculate commitment and nullifier hash correctly", async () => {
        const { proof, publicSignals } = await snarkjs.groth16.fullProve(
            { nullifier: 10, secret: 20 },
            "build/CommitmentHasherTest_js/CommitmentHasherTest.wasm",
            "build/CommitmentHasherTest.zkey");
        // console.log(publicSignals);
        // console.log(proof);
        const nullifierHash = mimc.multiHash([10]);
        // console.log(mimc.F.toString(nullifierHash))
        const commitmentHash = mimc.multiHash([10, 20]);
        // console.log(mimc.F.toString(commitmentHash))
        assert.equal(publicSignals[0], mimc.F.toString(commitmentHash))
        assert.equal(publicSignals[1], mimc.F.toString(nullifierHash))
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
        const zeros = generateZeros(mimc, 10)
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

        const res2 = calculateMerkleRootAndPath(mimc, 10, [])
        // console.log(ethers.BigNumber.from(res2).toHexString())

        assert.equal(ethers.BigNumber.from(res).toHexString(), ethers.BigNumber.from(res2.root).toHexString());
    })


    it("Should calculate the root correctly after deposit 1.", async () => {
        zktreetest.deposit(1);

        const res = await zktreetest.getLastRoot();
        // console.log(ethers.BigNumber.from(res).toHexString())

        const res2 = calculateMerkleRootAndPath(mimc, 10, [1], 1)
        // console.log(res2)

        assert.equal(ethers.BigNumber.from(res).toHexString(), ethers.BigNumber.from(res2.root).toHexString());
    })

    it("Should calculate the root correctly after deposit 2.", async () => {
        zktreetest.deposit(2);

        const res = await zktreetest.getLastRoot();
        // console.log(ethers.BigNumber.from(res).toHexString())

        const res2 = calculateMerkleRootAndPath(mimc, 10, [1, 2], 2)
        // console.log(res2)

        assert.equal(ethers.BigNumber.from(res).toHexString(), ethers.BigNumber.from(res2.root).toHexString());
    })

    it("Should calculate the root and proof correctly after deposit 3.", async () => {
        zktreetest.deposit(3);

        const res = await zktreetest.getLastRoot();
        // console.log(ethers.BigNumber.from(res).toHexString())

        const res2 = calculateMerkleRootAndPath(mimc, 10, [1, 2, 3], 3)
        const root = checkMerkleProof(mimc, 10, res2.pathElements, res2.pathIndices, 3)

        assert.equal(ethers.BigNumber.from(res).toHexString(), ethers.BigNumber.from(res2.root).toHexString());
        assert.equal(ethers.BigNumber.from(res).toHexString(), ethers.BigNumber.from(root).toHexString());
    })

    it("Should calculate the root and proof correctly from events", async () => {
        const res = await zktreetest.getLastRoot();
        // console.log(ethers.BigNumber.from(res).toHexString())

        const events = await zktreetest.queryFilter(zktreetest.filters.Deposit())
        let commitments = []
        for (let event of events) {
            commitments.push(ethers.BigNumber.from(event.args.commitment))
        }

        const res2 = calculateMerkleRootAndPath(mimc, 10, commitments, 3)
        const root = checkMerkleProof(mimc, 10, res2.pathElements, res2.pathIndices, 3)

        assert.equal(ethers.BigNumber.from(res).toHexString(), ethers.BigNumber.from(res2.root).toHexString());
        assert.equal(ethers.BigNumber.from(res).toHexString(), ethers.BigNumber.from(root).toHexString());
    })

})