// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./ZKTree.sol";

contract ZKTreeTest is ZKTree {
    constructor(uint32 _levels, IHasher _hasher) ZKTree(_levels, _hasher) {}

    function commit(uint256 _commitment) external {
        _commit(bytes32(_commitment));
    }
}
