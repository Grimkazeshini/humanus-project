// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract AIDevInterface {
    struct Task {
        string description;
        address requester;
        uint256 reward;
        bool completed;
    }

    Task[] public tasks;
    IERC20 public godToken;

    event TaskCreated(uint256 indexed taskId, string description, address indexed requester, uint256 reward);
    event TaskCompleted(uint256 indexed taskId, address indexed completer);

    constructor(IERC20 _godToken) {
        godToken = _godToken;
    }

    function createTask(string memory description, uint256 bountyAmount) public {
        require(godToken.transferFrom(msg.sender, address(this), bountyAmount), "Token transfer failed");
        tasks.push(Task(description, msg.sender, bountyAmount, false));
        emit TaskCreated(tasks.length - 1, description, msg.sender, bountyAmount);
    }

    function markCompleted(uint256 taskId) public {
        require(taskId < tasks.length, "Invalid task id");
        Task storage task = tasks[taskId];
        require(!task.completed, "Already completed");
        task.completed = true;
        require(godToken.transfer(msg.sender, task.reward), "Bounty transfer failed");
        emit TaskCompleted(taskId, msg.sender);
    }
}
