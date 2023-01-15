# zk-merkle-tree

A JavaScript library for anonymous voting on Ethereum blockchain using zero-knowledge proof.

The library is based on the source code of [Tornado Cash](https://github.com/tornadocash/tornado-core). The most essential component of TC is a Merkle tree where users can deposit ethers with a random `commitment`, that can be withdrawn with a `nullifier`. The nullifier is assigned to the commitment, but nobody knows which commitment is assigned to which nullifier, because the link between them is the zero-knowledge. This method can be also used for anonymous voting, where the voter sends a commitment in the registration phase, and a nullifier when she votes. This method ensures that one voter can vote only once. For more info, please read [my article about zero-knowledge proofs](https://betterprogramming.pub/understanding-zero-knowledge-proofs-through-the-source-code-of-tornado-cash-41d335c5475f).

## Usage

Create your own voting contract that is inherited from `zk-merkle-tree/contracts/ZKTree.sol`.

Implement the `_commit` and `_nullify` methods.

A simple implementation of the ZKTree contract looks like this (from the [zktree-vote](https://github.com/TheBojda/zktree-vote) project):

```
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "zk-merkle-tree/contracts/ZKTree.sol";

contract ZKTreeVote is ZKTree {
    address public owner;
    mapping(address => bool) public validators;
    mapping(uint256 => bool) uniqueHashes;
    uint numOptions;
    mapping(uint => uint) optionCounter;

    constructor(
        uint32 _levels,
        IHasher _hasher,
        IVerifier _verifier,
        uint _numOptions
    ) ZKTree(_levels, _hasher, _verifier) {
        owner = msg.sender;
        numOptions = _numOptions;
        for (uint i = 0; i <= numOptions; i++) optionCounter[i] = 0;
    }

    function registerValidator(address _validator) external {
        require(msg.sender == owner, "Only owner can add validator!");
        validators[_validator] = true;
    }

    function registerCommitment(
        uint256 _uniqueHash,
        uint256 _commitment
    ) external {
        require(validators[msg.sender], "Only validator can commit!");
        require(
            !uniqueHashes[_uniqueHash],
            "This unique hash is already used!"
        );
        _commit(bytes32(_commitment));
        uniqueHashes[_uniqueHash] = true;
    }

    function vote(
        uint _option,
        uint256 _nullifier,
        uint256 _root,
        uint[2] memory _proof_a,
        uint[2][2] memory _proof_b,
        uint[2] memory _proof_c
    ) external {
        require(_option <= numOptions, "Invalid option!");
        _nullify(
            bytes32(_nullifier),
            bytes32(_root),
            _proof_a,
            _proof_b,
            _proof_c
        );
        optionCounter[_option] = optionCounter[_option] + 1;
    }

    function getOptionCounter(uint _option) external view returns (uint) {
        return optionCounter[_option];
    }
}
```

The constructor has 4 parameters:
- `_levels` is the levels of the Merkle tree. **It has to be 20 if you use the default Verifier.** If you want to use different number of levels, you have to implement your own Verifier circuit.
- `_hasher` is the address of the MiMC sponge smart contract. (Check the `test` folder for the MiMC sponge generator code.) 
- `_verifier` is the address of the Verifier contract. It is generated from the Verifier (`circuits/Verifier.circom`) circuit by the prepare script (`scripts/preapre.sh`).
- `_numOptions` is the number of options.


The `registerCommitment` method implements the `_commit` method. It has 2 parameters:
- `_uniqueHash` is a unique hash of the voter (ex.: the hash of the ID card). It ensures that one voter is registered only once.
- `_commitment` is the commitment of the user.

The `vote` method implements the `_nullify` method. It has 6 parameters:
- `_option` is the option what the voter chooses.
- `_nullifier` is the nullifier for the commitment.
- `_root` is the Merkle root for the proof.
- `_proof_a`, `_proof_b` and `_proof_c` are the zero-knowledge proof.

The commitment and the nullifier is generated on the client side by the `generateCommitment` method. (Please check the [VoterRegistration](https://github.com/TheBojda/zktree-vote/blob/main/src/components/VoterRegistration.vue) component in the `zktree-vote` project.) 

To generate the zero-knowledge proof, use `calculateMerkleRootAndZKProof`. (Please check the [Vote](https://github.com/TheBojda/zktree-vote/blob/main/src/components/Vote.vue) component in the `zktree-vote` project.)

For more info, please check the `test` folder in the repository and the [zktree-vote](https://github.com/TheBojda/zktree-vote) project.

