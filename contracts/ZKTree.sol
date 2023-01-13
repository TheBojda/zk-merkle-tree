// based on https://github.com/tornadocash/tornado-core/blob/master/contracts/Tornado.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./MerkleTreeWithHistory.sol";

interface IVerifier {
    function verifyProof(
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[2] memory input
    ) external pure returns (bool r);
}

contract ZKTree is MerkleTreeWithHistory {
    mapping(bytes32 => bool) public nullifiers;
    mapping(bytes32 => bool) public commitments;

    IVerifier public immutable verifier;

    event Commit(
        bytes32 indexed commitment,
        uint32 leafIndex,
        uint256 timestamp
    );

    constructor(
        uint32 _levels,
        IHasher _hasher,
        IVerifier _verifier
    ) MerkleTreeWithHistory(_levels, _hasher) {
        verifier = _verifier;
    }

    function _commit(bytes32 _commitment) internal {
        require(!commitments[_commitment], "The commitment has been submitted");

        commitments[_commitment] = true;
        uint32 insertedIndex = _insert(_commitment);
        emit Commit(_commitment, insertedIndex, block.timestamp);
    }

    function _nullify(
        bytes32 _nullifier,
        bytes32 _root,
        uint[2] memory _proof_a,
        uint[2][2] memory _proof_b,
        uint[2] memory _proof_c
    ) internal {
        require(!nullifiers[_nullifier], "The nullifier has been submitted");
        require(isKnownRoot(_root), "Cannot find your merkle root");
        require(
            verifier.verifyProof(
                _proof_a,
                _proof_b,
                _proof_c,
                [uint256(_nullifier), uint256(_root)]
            ),
            "Invalid proof"
        );

        nullifiers[_nullifier] = true;        
    }
}
