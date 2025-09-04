// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Governance {
    struct Proposal {
        string description;
        uint256 voteCount;
        bool executed;
    }

    Proposal[] public proposals;
    mapping(address => mapping(uint256 => bool)) public votes;

    event ProposalCreated(uint256 proposalId, string description);
    event Voted(uint256 proposalId, address voter);
    event ProposalExecuted(uint256 proposalId);

    function createProposal(string memory description) public {
        proposals.push(Proposal(description, 0, false));
        emit ProposalCreated(proposals.length - 1, description);
    }

    function vote(uint256 proposalId) public {
        require(proposalId < proposals.length, "Proposal does not exist");
        require(!votes[msg.sender][proposalId], "Already voted");

        proposals[proposalId].voteCount++;
        votes[msg.sender][proposalId] = true;
        emit Voted(proposalId, msg.sender);
    }

    function executeProposal(uint256 proposalId) public {
        require(proposalId < proposals.length, "Proposal does not exist");
        Proposal storage proposal = proposals[proposalId];
        require(!proposal.executed, "Already executed");
        require(proposal.voteCount >= 3, "Not enough votes");
        proposal.executed = true;
        emit ProposalExecuted(proposalId);
    }
}
