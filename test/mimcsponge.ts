import chai from "chai";
import { ethers } from "hardhat";
import { buildMimcSponge, mimcSpongecontract } from 'circomlibjs'

const assert = chai.assert;

const SEED = "mimcsponge";

describe("MiMC Sponge Smart contract test", () => {

    let mimc: any
    let mimc_contract: any

    before(async () => {
        mimc = await buildMimcSponge();
        const signers = await ethers.getSigners()
        const contract = new ethers.ContractFactory(mimcSpongecontract.abi, mimcSpongecontract.createCode(SEED, 220), signers[0])
        mimc_contract = await contract.deploy()
    });

    it("Should calculate the mimc correctly", async () => {
        const res = await mimc_contract["MiMCSponge"](1, 2, 3);
        console.log(res.xL.toString())
        console.log(res.xR.toString())
        const res2 = mimc.hash(1, 2, 3);
        console.log(mimc.F.toString(res2.xL))
        console.log(mimc.F.toString(res2.xR))
        assert.equal(res.xL.toString(), mimc.F.toString(res2.xL));
        assert.equal(res.xR.toString(), mimc.F.toString(res2.xR));
    })

})