import { assert } from "chai";
import { ethers } from "hardhat";
import { buildMimcSponge, mimcSpongecontract, buildPedersenHash } from 'circomlibjs'
import { Contract } from "ethers";
import { bigInt } from 'snarkjs'
import { ZKTreeTest } from "../typechain-types";
import { getCurveFromName } from 'ffjavascript'

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

    it("Should calculate hash correctly", async () => {
        const res = await zktreetest.hashLeftRight(1, 2);
        console.log(res)

        const res2 = mimc.multiHash([1, 2]);
        console.log(ethers.BigNumber.from(mimc.F.toString(res2)).toHexString());

        assert.equal(res, ethers.BigNumber.from(mimc.F.toString(res2)).toHexString());
    })

})