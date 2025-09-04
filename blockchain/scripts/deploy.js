const { ethers, upgrades } = require("hardhat");
const fs = require("fs");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy GodToken
  const GodToken = await ethers.getContractFactory("GodToken");
  console.log("Deploying GodToken...");
  const godTokenProxy = await upgrades.deployProxy(GodToken, [], {
    initializer: "initialize",
  });
  await godTokenProxy.waitForDeployment();
  console.log("GodToken Proxy deployed to:", await godTokenProxy.getAddress());

  // Deploy Staking
  const Staking = await ethers.getContractFactory("Staking");
  console.log("Deploying Staking...");
  const stakingProxy = await upgrades.deployProxy(Staking, [await godTokenProxy.getAddress(), 5e16], { // 5% APR
    initializer: "initialize",
  });
  await stakingProxy.waitForDeployment();
  console.log("Staking Proxy deployed to:", await stakingProxy.getAddress());

  // Save addresses to file
  const addresses = {
    GodTokenProxy: await godTokenProxy.getAddress(),
    GodTokenImplementation: await upgrades.erc1967.getImplementationAddress(await godTokenProxy.getAddress()),
    StakingProxy: await stakingProxy.getAddress(),
    StakingImplementation: await upgrades.erc1967.getImplementationAddress(await stakingProxy.getAddress())
  };
  
  fs.writeFileSync("deployed-addresses.json", JSON.stringify(addresses, null, 2));
  console.log("Addresses saved to deployed-addresses.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });