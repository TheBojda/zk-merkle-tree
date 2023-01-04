// based on https://github.com/tornadocash/fixed-merkle-tree

import { buildMimcSponge } from 'circomlibjs'
import { BigNumber } from 'ethers'

const ZERO_VALUE = BigNumber.from('21663839004416932945382355908790599225266501822907911457504978515578255421292') // = keccak256("tornado") % FIELD_SIZE

function calculateHash(mimc, left, right) {
    return BigNumber.from(mimc.F.toString(mimc.multiHash([left, right])))
}

export function generateZeros(levels: number, mimc: any) {
    let zeros = []
    zeros[0] = ZERO_VALUE
    for (let i = 1; i <= levels; i++)
        zeros[i] = calculateHash(mimc, zeros[i - 1], zeros[i - 1]);
    return zeros
}


export async function calculateMerkleRoot(levels: number, elements: any[]) {
    const capacity = 2 ** levels
    if (elements.length > capacity) throw new Error('Tree is full')

    const mimc = await buildMimcSponge();


}