import { assert } from "chai";
import { ethers } from "hardhat";
import { buildMimcSponge, mimcSpongecontract, buildPedersenHash } from 'circomlibjs'
import { bigInt } from 'snarkjs'
import { ZKTreeTest } from "../typechain-types";
import { generateZeros } from '../src/zktree'

const SEED = "mimcsponge";

function toHex(number, length = 32) {
    const str = number instanceof Buffer ? number.toString('hex') : bigInt(number).toString(16)
    return '0x' + str.padStart(length * 2, '0')
}

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

    it('Should generate zeros correctly', async () => {
        const zeros = generateZeros(10, mimc)
        console.log(ethers.BigNumber.from(zeros[0]).toHexString())
        console.log(ethers.BigNumber.from(zeros[1]).toHexString())
        console.log(ethers.BigNumber.from(zeros[2]).toHexString())
        console.log(ethers.BigNumber.from(zeros[3]).toHexString())

        assert.equal(ethers.BigNumber.from(zeros[0]).toHexString(), '0x2fe54c60d3acabf3343a35b6eba15db4821b340f76e741e2249685ed4899af6c')
        assert.equal(ethers.BigNumber.from(zeros[1]).toHexString(), '0x256a6135777eee2fd26f54b8b7037a25439d5235caee224154186d2b8a52e31d')
        assert.equal(ethers.BigNumber.from(zeros[2]).toHexString(), '0x1151949895e82ab19924de92c40a3d6f7bcb60d92b00504b8199613683f0c200')
        assert.equal(ethers.BigNumber.from(zeros[3]).toHexString(), '0x20121ee811489ff8d61f09fb89e313f14959a0f28bb428a20dba6b0b068b3bdb')
    })

    it("Should calculate hash correctly", async () => {
        const zero = ethers.BigNumber.from('21663839004416932945382355908790599225266501822907911457504978515578255421292')    

        const res = await zktreetest.hashLeftRight(zero, zero);
        console.log(res)

        const res2 = mimc.multiHash([zero, zero]);
        console.log(ethers.BigNumber.from(mimc.F.toString(res2)).toHexString());

        assert.equal(res, ethers.BigNumber.from(mimc.F.toString(res2)).toHexString());
    })

    it("Should calculate the root correctly after deposit 1.", async () => {
        zktreetest.deposit(1);

        const res = await zktreetest.getLastRoot();
        console.log(res)
    })

    it("Should calculate the root correctly after deposit 2.", async () => {
        zktreetest.deposit(2);

        const res = await zktreetest.getLastRoot();
        console.log(res)
    })

    it("Should calculate the root correctly after deposit 3.", async () => {
        zktreetest.deposit(3);

        const res = await zktreetest.getLastRoot();
        console.log(res)
    })

})