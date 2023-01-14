# zktree

A JavaScript library for anonymous voting on Ethereum blockchain using zero-knowledge proof.

## Usage

Create your own voting contract that is inherited from `zktree/contracts/ZKTree.sol`.

Implement the `commit` and `nullify` methods.

Use `generateCommitment` to generate the commitment with nullifier and secret.

Use `calculateMerkleRootAndZKProof` to generate the ZKP.

(Real documentation is coming soon.)

Check the test folder and the [zktree-vote](https://github.com/TheBojda/zktree-vote) project.
