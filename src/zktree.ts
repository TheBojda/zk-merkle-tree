// based on https://github.com/tornadocash/fixed-merkle-tree

import { BigNumber } from 'ethers'
import { ethers } from 'hardhat'
import * as crypto from 'crypto'

const ZERO_VALUE = BigNumber.from('21663839004416932945382355908790599225266501822907911457504978515578255421292') // = keccak256("tornado") % FIELD_SIZE

function calculateHash(mimc, left, right) {
    return BigNumber.from(mimc.F.toString(mimc.multiHash([left, right])))
}

export function generateCommitment(mimc) {
    const nullifier = BigNumber.from(crypto.randomBytes(31)).toString()
    const secret = BigNumber.from(crypto.randomBytes(31)).toString()
    const commitment = mimc.F.toString(mimc.multiHash([nullifier, secret]))
    const nullifierHash = mimc.F.toString(mimc.multiHash([nullifier]))
    return {
        nullifier: nullifier,
        secret: secret,
        commitment: commitment,
        nullifierHash: nullifierHash
    }
}

export function generateZeros(mimc: any, levels: number) {
    let zeros = []
    zeros[0] = ZERO_VALUE
    for (let i = 1; i <= levels; i++)
        zeros[i] = calculateHash(mimc, zeros[i - 1], zeros[i - 1]);
    return zeros
}

// calculates Merkle root from elements and a path to the given element 
export function calculateMerkleRootAndPath(mimc: any, levels: number, elements: any[], element?: any) {
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

    const root = layers[levels].length > 0 ? layers[levels][0] : zeros[levels - 1]

    let pathElements = []
    let pathIndices = []

    if (element) {
        const bne = ethers.BigNumber.from(element)
        let index = layers[0].findIndex(e => ethers.BigNumber.from(e).eq(bne))
        // console.log('idx: ' + index)
        for (let level = 0; level < levels; level++) {
            pathIndices[level] = index % 2
            pathElements[level] = (index ^ 1) < layers[level].length ? layers[level][index ^ 1] : zeros[level]
            index >>= 1
        }
    }

    return {
        root: root,
        pathElements: pathElements.map((v) => v.toString()),
        pathIndices: pathIndices.map((v) => v.toString())
    }
}

export function checkMerkleProof(mimc: any, levels: number, pathElements: any[], pathIndices: any[], element: any) {
    // console.log(pathElements)
    // console.log(pathIndices)
    let hashes = []
    for (let i = 0; i < levels; i++) {
        const in0 = (i == 0) ? element : hashes[i - 1]
        const in1 = pathElements[i]
        // console.log(`in0: ${in0} in1: ${in1}`)
        if (pathIndices[i] == 0) {
            hashes[i] = calculateHash(mimc, in0, in1)
        } else {
            hashes[i] = calculateHash(mimc, in1, in0)
        }
        // console.log(`in0: ${in0} in1: ${in1} hash: ${hashes[i]}`)
    }
    return hashes[levels - 1]
}