// based on https://github.com/tornadocash/tornado-core/blob/master/contracts/Tornado.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./MerkleTreeWithHistory.sol";

contract ZKTree is MerkleTreeWithHistory {
    mapping(bytes32 => bool) public nullifierHashes;
    mapping(bytes32 => bool) public commitments;

    event Commit(
        bytes32 indexed commitment,
        uint32 leafIndex,
        uint256 timestamp
    );

    constructor(
        uint32 _levels,
        IHasher _hasher
    ) MerkleTreeWithHistory(_levels, _hasher) {}

    function _commit(bytes32 _commitment) internal {
        require(!commitments[_commitment], "The commitment has been submitted");

        commitments[_commitment] = true;
        uint32 insertedIndex = _insert(_commitment);
        emit Commit(_commitment, insertedIndex, block.timestamp);
    }
}
