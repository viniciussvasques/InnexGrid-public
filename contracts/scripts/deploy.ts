import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // Deploy InnexGridToken
  console.log("\nDeploying InnexGridToken...");
  const InnexGridToken = await ethers.getContractFactory("InnexGridToken");
  const token = await InnexGridToken.deploy(deployer.address);
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("InnexGridToken deployed to:", tokenAddress);

  // Deploy ResourceProvider
  console.log("\nDeploying ResourceProvider...");
  const ResourceProvider = await ethers.getContractFactory("ResourceProvider");
  const resourceProvider = await ResourceProvider.deploy(deployer.address);
  await resourceProvider.waitForDeployment();
  const resourceProviderAddress = await resourceProvider.getAddress();
  console.log("ResourceProvider deployed to:", resourceProviderAddress);

  // Deploy RewardDistribution
  console.log("\nDeploying RewardDistribution...");
  const RewardDistribution = await ethers.getContractFactory("RewardDistribution");
  const rewardDistribution = await RewardDistribution.deploy(
    deployer.address,
    tokenAddress,
    resourceProviderAddress
  );
  await rewardDistribution.waitForDeployment();
  const rewardDistributionAddress = await rewardDistribution.getAddress();
  console.log("RewardDistribution deployed to:", rewardDistributionAddress);

  // Deploy ResourceEscrow
  console.log("\nDeploying ResourceEscrow...");
  const ResourceEscrow = await ethers.getContractFactory("ResourceEscrow");
  const resourceEscrow = await ResourceEscrow.deploy(
    deployer.address,
    tokenAddress,
    deployer.address // Using deployer as initial oracle
  );
  await resourceEscrow.waitForDeployment();
  const resourceEscrowAddress = await resourceEscrow.getAddress();
  console.log("ResourceEscrow deployed to:", resourceEscrowAddress);

  console.log("\n=== Deployment Summary ===");
  console.log("InnexGridToken:", tokenAddress);
  console.log("ResourceProvider:", resourceProviderAddress);
  console.log("RewardDistribution:", rewardDistributionAddress);
  console.log("ResourceEscrow:", resourceEscrowAddress);
  console.log("\nSave these addresses for frontend/backend integration!");
}

try {
  await main();
  process.exit(0);
} catch (error) {
  console.error(error);
  process.exit(1);
}



