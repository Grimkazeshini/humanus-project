// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./interfaces/IGOD.sol";

contract Staking is Initializable, ReentrancyGuardUpgradeable, UUPSUpgradeable {
    IGOD public godToken;
    
    // Staking user data
    mapping(address => uint256) public balances;
    mapping(address => uint256) public stakeTimestamps;
    
    // Staking parameters
    uint256 public apr; // Annual Percentage Rate (scaled by 1e18, e.g., 5% = 5e16)
    uint256 constant public SECONDS_PER_YEAR = 365 days;
    
    event Staked(address indexed user, uint256 amount, uint256 timestamp);
    event Unstaked(address indexed user, uint256 amount, uint256 reward, uint256 timestamp);
    event APRUpdated(uint256 newAPR);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address _godTokenAddress, uint256 _apr) initializer public {
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();
        
        godToken = IGOD(_godTokenAddress);
        apr = _apr;
    }

    function stake(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be > 0");
        require(godToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        // Claim any existing rewards first to avoid complexity
        if (balances[msg.sender] > 0) {
            _claimReward();
        }
        
        balances[msg.sender] += amount;
        stakeTimestamps[msg.sender] = block.timestamp;
        
        emit Staked(msg.sender, amount, block.timestamp);
    }

    function unstake() external nonReentrant {
        require(balances[msg.sender] > 0, "Nothing to unstake");
        _claimReward();
    }

    function _claimReward() internal {
        uint256 principal = balances[msg.sender];
        uint256 stakedTime = block.timestamp - stakeTimestamps[msg.sender];
        uint256 reward = calculateReward(principal, stakedTime);
        
        // Reset stake
        balances[msg.sender] = 0;
        stakeTimestamps[msg.sender] = 0;
        
        // Transfer principal + reward
        uint256 totalAmount = principal + reward;
        require(godToken.transfer(msg.sender, totalAmount), "Reward transfer failed");
        
        emit Unstaked(msg.sender, principal, reward, block.timestamp);
    }

    function calculateReward(uint256 principal, uint256 stakedTime) public view returns (uint256) {
        if (principal == 0 || stakedTime == 0) return 0;
        return (principal * apr * stakedTime) / (SECONDS_PER_YEAR * 1e18);
    }

    function getPendingReward(address user) external view returns (uint256) {
        if (balances[user] == 0) return 0;
        uint256 stakedTime = block.timestamp - stakeTimestamps[user];
        return calculateReward(balances[user], stakedTime);
    }

    function updateAPR(uint256 _newAPR) external {
        // For now, only the deployer can update. Consider moving to governance later.
        require(msg.sender == 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266, "Not authorized");
        apr = _newAPR;
        emit APRUpdated(_newAPR);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}