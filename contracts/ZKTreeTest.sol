// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./ZKTree.sol";

contract ZKTreeTest is ZKTree {
    constructor(
        uint32 _levels,
        IHasher _hasher,
        IVerifier _verifier
    ) ZKTree(_levels, _hasher, _verifier) {}

    function commit(uint256 _commitment) external {
        _commit(bytes32(_commitment));
    }

    function nullify(
        bytes32 _nullifier,
        bytes32 _root,
        uint[2] memory _proof_a,
        uint[2][2] memory _proof_b,
        uint[2] memory _proof_c
    ) external {
       _nullify(_nullifier, _root, _proof_a, _proof_b, _proof_c);
    }
}
