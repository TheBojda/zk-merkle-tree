// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./ZKTree.sol";

contract ZKTreeTest is ZKTree {
    constructor(uint32 _levels, IHasher _hasher) ZKTree(_levels, _hasher) {}

    function deposit(bytes32 _commitment) external {
        _deposit(_commitment);
    }
}
