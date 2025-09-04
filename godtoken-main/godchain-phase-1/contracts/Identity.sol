// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "@openzeppelin/contracts/access/Ownable.sol";

contract Identity is Ownable {
    struct Profile {
        string handle;
        string metadataURI;
        bool verified;
    }

    mapping(address => Profile) public profiles;

    event ProfileCreated(address indexed user, string handle, string metadataURI);
    event ProfileVerified(address indexed user);

    function createProfile(string memory handle, string memory metadataURI) public {
        profiles[msg.sender] = Profile(handle, metadataURI, false);
        emit ProfileCreated(msg.sender, handle, metadataURI);
    }

    // Note: verification is owner-only; use the deployer account for testing
    function verifyProfile(address user) public onlyOwner {
        profiles[user].verified = true;
        emit ProfileVerified(user);
    }
}
