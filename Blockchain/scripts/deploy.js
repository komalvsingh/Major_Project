const { ethers } = require("hardhat");

async function main() {
    console.log("Deploying ScholarshipContract...");
    
    // Get the contract factory
    const ScholarshipContract = await ethers.getContractFactory("ScholarshipContract");
    
    // Deploy the contract
    const scholarship = await ScholarshipContract.deploy();
    
    // Wait for deployment (older ethers version)
    await scholarship.deployed();
    
    console.log("ScholarshipContract deployed to:", scholarship.address);
    
    // Get deployer address
    const [deployer] = await ethers.getSigners();
    console.log("Deployed by:", deployer.address);
    console.log("Contract owner:", await scholarship.owner());
    
    // Verify deployer is admin
    const [role, isActive] = await scholarship.getUserRole(deployer.address);
    console.log("Deployer role:", role.toString(), "Active:", isActive);
    
    // Optional: Fund the contract with some initial ETH for scholarships
    console.log("\nFunding contract with initial scholarship funds...");
    const fundAmount = ethers.utils.parseEther("1.0"); // 1 ETH for testing
    const fundTx = await scholarship.depositFunds({ value: fundAmount });
    await fundTx.wait();
    
    const treasuryBalance = await scholarship.getTreasuryBalance();
    console.log("Treasury balance:", ethers.utils.formatEther(treasuryBalance), "ETH");
    
    const standardAmount = await scholarship.standardScholarshipAmount();
    console.log("Standard scholarship amount:", ethers.utils.formatEther(standardAmount), "ETH");
    
    return scholarship.address;
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });