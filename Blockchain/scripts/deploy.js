const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("🚀 Starting deployment to Polygon testnet...");
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Deploy RoleManagement first
  console.log("\n📝 Deploying RoleManagement contract...");
  const RoleManagement = await hre.ethers.getContractFactory("RoleManagement");
  const roleManagement = await RoleManagement.deploy();
  await roleManagement.deployed();
  console.log("✅ RoleManagement deployed to:", roleManagement.address);

  // Deploy IPFSEncryption
  console.log("\n📝 Deploying IPFSEncryption contract...");
  const IPFSEncryption = await hre.ethers.getContractFactory("IPFSEncryption");
  const ipfsEncryption = await IPFSEncryption.deploy(roleManagement.address);
  await ipfsEncryption.deployed();
  console.log("✅ IPFSEncryption deployed to:", ipfsEncryption.address);

  // Deploy ScholarshipRegistry
  console.log("\n📝 Deploying ScholarshipRegistry contract...");
  const ScholarshipRegistry = await hre.ethers.getContractFactory("ScholarshipRegistry");
  const scholarshipRegistry = await ScholarshipRegistry.deploy(roleManagement.address);
  await scholarshipRegistry.deployed();
  console.log("✅ ScholarshipRegistry deployed to:", scholarshipRegistry.address);

  // Deploy DocumentVerificationDAO
  console.log("\n📝 Deploying DocumentVerificationDAO contract...");
  const DocumentVerificationDAO = await hre.ethers.getContractFactory("DocumentVerificationDAO");
  const documentVerificationDAO = await DocumentVerificationDAO.deploy(
    roleManagement.address,
    scholarshipRegistry.address
  );
  await documentVerificationDAO.deployed();
  console.log("✅ DocumentVerificationDAO deployed to:", documentVerificationDAO.address);

  // Deploy FinanceDisbursement
  console.log("\n📝 Deploying FinanceDisbursement contract...");
  const FinanceDisbursement = await hre.ethers.getContractFactory("FinanceDisbursement");
  const financeDisbursement = await FinanceDisbursement.deploy(
    roleManagement.address,
    scholarshipRegistry.address
  );
  await financeDisbursement.deployed();
  console.log("✅ FinanceDisbursement deployed to:", financeDisbursement.address);

  // Wait for confirmations
  console.log("\n⏳ Waiting for block confirmations...");
  await roleManagement.deployTransaction.wait(5);
  await ipfsEncryption.deployTransaction.wait(5);
  await scholarshipRegistry.deployTransaction.wait(5);
  await documentVerificationDAO.deployTransaction.wait(5);
  await financeDisbursement.deployTransaction.wait(5);

  // Save contract addresses
  const contractAddresses = {
    RoleManagement: roleManagement.address,
    IPFSEncryption: ipfsEncryption.address,
    ScholarshipRegistry: scholarshipRegistry.address,
    DocumentVerificationDAO: documentVerificationDAO.address,
    FinanceDisbursement: financeDisbursement.address,
    network: hre.network.name,
    deployedAt: new Date().toISOString()
  };

  const addressesPath = path.join(__dirname, '..', 'contract-addresses.json');
  fs.writeFileSync(addressesPath, JSON.stringify(contractAddresses, null, 2));
  console.log("✅ Contract addresses saved to:", addressesPath);

  // Setup initial roles (optional)
  console.log("\n👤 Setting up initial demo accounts...");
  
  // You can add demo accounts here
  // Example:
  // await roleManagement.assignRole("0x...", 1); // DAO_REVIEWER
  // await roleManagement.assignRole("0x...", 2); // FINANCE_BUREAU

  console.log("\n🎉 Deployment completed successfully!");
  console.log("\n📋 Contract Addresses:");
  console.log("RoleManagement:", roleManagement.address);
  console.log("IPFSEncryption:", ipfsEncryption.address);
  console.log("ScholarshipRegistry:", scholarshipRegistry.address);
  console.log("DocumentVerificationDAO:", documentVerificationDAO.address);
  console.log("FinanceDisbursement:", financeDisbursement.address);

  console.log("\n🔗 Verify contracts on PolygonScan:");
  console.log(`npx hardhat verify --network polygon_testnet ${roleManagement.address}`);
  console.log(`npx hardhat verify --network polygon_testnet ${ipfsEncryption.address} "${roleManagement.address}"`);
  console.log(`npx hardhat verify --network polygon_testnet ${scholarshipRegistry.address} "${roleManagement.address}"`);
  console.log(`npx hardhat verify --network polygon_testnet ${documentVerificationDAO.address} "${roleManagement.address}" "${scholarshipRegistry.address}"`);
  console.log(`npx hardhat verify --network polygon_testnet ${financeDisbursement.address} "${roleManagement.address}" "${scholarshipRegistry.address}"`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });