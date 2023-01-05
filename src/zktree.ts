// based on https://github.com/tornadocash/fixed-merkle-tree

import { buildMimcSponge } from 'circomlibjs'
import { BigNumber } from 'ethers'

const ZERO_VALUE = BigNumber.from('21663839004416932945382355908790599225266501822907911457504978515578255421292') // = keccak256("tornado") % FIELD_SIZE

function calculateHash(mimc, left, right) {
    return BigNumber.from(mimc.F.toString(mimc.multiHash([left, right])))
}

export function generateZeros(mimc: any, levels: number) {
    let zeros = []
    zeros[0] = ZERO_VALUE
    for (let i = 1; i <= levels; i++)
        zeros[i] = calculateHash(mimc, zeros[i - 1], zeros[i - 1]);
    return zeros
}


export function calculateMerkleRoot(mimc: any, levels: number, elements: any[]) {
    const capacity = 2 ** levels
    if (elements.length > capacity) throw new Error('Tree is full')

    const zeros = generateZeros(mimc, levels);
    let layers = []
    layers[0] = elements.slice()
    for (let level = 1; level <= levels; level++) {
        layers[level] = []
        for (let i = 0; i < Math.ceil(layers[level - 1].length / 2); i++) {
            layers[level][i] = calculateHash(
                mimc,
                layers[level - 1][i * 2],
                i * 2 + 1 < layers[level - 1].length ? layers[level - 1][i * 2 + 1] : zeros[level - 1],
            )
        }
    }

    return layers[levels].length > 0 ? layers[levels][0] : zeros[levels - 1]
}