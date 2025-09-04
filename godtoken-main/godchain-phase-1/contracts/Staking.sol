// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

interface IToken {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
}

contract Staking is ReentrancyGuard {
    IToken public token;
    mapping(address => uint256) public balances;
    mapping(address => uint256) public stakeTimestamps;

    event Staked(address indexed user, uint256 amount, uint256 timestamp);
    event Unstaked(address indexed user, uint256 amount, uint256 timestamp);

    constructor(address tokenAddress) {
        token = IToken(tokenAddress);
    }

    function stake(uint256 amount) public nonReentrant {
        require(amount > 0, "Amount must be > 0");
        require(token.transferFrom(msg.sender, address(this), amount), "Token transfer failed");
        balances[msg.sender] += amount;
        stakeTimestamps[msg.sender] = block.timestamp;
        emit Staked(msg.sender, amount, block.timestamp);
    }

    function unstake() public nonReentrant {
        uint256 amount = balances[msg.sender];
        require(amount > 0, "Nothing to unstake");
        balances[msg.sender] = 0;
        require(token.transfer(msg.sender, amount), "Token transfer failed");
        emit Unstaked(msg.sender, amount, block.timestamp);
    }
}
