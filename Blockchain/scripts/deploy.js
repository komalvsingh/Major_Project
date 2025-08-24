const { ethers } = require("hardhat");

async function main() {
    console.log("Deploying ScholarshipContract...");
    
    // Get the contract factory
    const ScholarshipContract = await ethers.getContractFactory("ScholarshipContract");
    
    // Deploy the contract
    const scholarship = await ScholarshipContract.deploy();
    
    // Wait for deployment
    await scholarship.deployed();
    
    console.log("✅ ScholarshipContract deployed to:", scholarship.address);
    console.log("🔗 View on Holesky Explorer: https://holesky.etherscan.io/address/" + scholarship.address);
    
    return scholarship.address;
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });