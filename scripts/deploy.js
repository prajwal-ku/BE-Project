const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  // Deploy contract
  const KrishiSetu = await hre.ethers.getContractFactory("KrishiSetu");
  const krishiSetu = await KrishiSetu.deploy();
  await krishiSetu.deployed();
  
  console.log("✅ Contract deployed to:", krishiSetu.address);
  
  // Save contract address to .env.local
  const envContent = `NEXT_PUBLIC_CONTRACT_ADDRESS=${krishiSetu.address}\n`;
  fs.writeFileSync(path.join(__dirname, '../.env.local'), envContent);
  
  // Save ABI to app/lib/blockchain
  const contractData = {
    address: krishiSetu.address,
    abi: krishiSetu.interface.format('json')
  };
  
  fs.writeFileSync(
    path.join(__dirname, '../app/lib/contracts/KrishiSetu.json'),
    JSON.stringify(contractData, null, 2)
  );
  
  console.log("📝 Contract ABI saved");
  console.log("🔧 .env.local updated with contract address");
  
  // Set the contract address in the blockchain module
  const blockchainPath = path.join(__dirname, '../app/lib/blockchain.ts');
  let blockchainContent = fs.readFileSync(blockchainPath, 'utf8');
  blockchainContent = blockchainContent.replace(
    /let contractAddress = '';/,
    `let contractAddress = '${krishiSetu.address}';`
  );
  fs.writeFileSync(blockchainPath, blockchainContent);
  
  console.log("🔗 Blockchain module updated");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
  