const Web3 = require('web3').default;
const fs = require('fs');

async function test() {
  const web3 = new Web3('http://127.0.0.1:7545');
  const accounts = await web3.eth.getAccounts();
  
  console.log('✅ Connected to Ganache');
  console.log('Account:', accounts[0]);
  
  // Load contract
  const contractData = JSON.parse(fs.readFileSync('./build/contracts/KrishiSetu.json'));
  const contractAddress = "0x17132d5b75Aa12A67881895573d043961349ba55";
  
  console.log('✅ Contract address:', contractAddress);
  
  const contract = new web3.eth.Contract(contractData.abi, contractAddress);
  
  // Get product counter first
  const counter = await contract.methods.productCounter().call();
  console.log('Current product counter:', counter);
  
  // Register a product
  console.log('\n📝 Registering product...');
  const tx = await contract.methods
    .registerProduct("Organic Basmati Rice", 100, 2500, "Punjab, India", "Cereals")
    .send({ from: accounts[0], gas: 500000 });
  
  console.log('✅ Product registered!');
  console.log('Transaction:', tx.transactionHash);
  
  // Get updated product counter
  const newCounter = await contract.methods.productCounter().call();
  console.log('\n📊 Total products:', newCounter);
  
  // Get product details
  const product = await contract.methods.getProductDetails(1).call();
  console.log('\n📦 Product Details:');
  console.log('  Name:', product[0]);
  console.log('  Quantity:', product[1]);
  console.log('  Price:', product[2]);
  console.log('  Farmer:', product[3]);
  console.log('  Current Owner:', product[4]);
  console.log('  Location:', product[5]);
  console.log('  Timestamp:', new Date(parseInt(product[6]) * 1000).toLocaleString());
  
  // Get all products
  const allProducts = await contract.methods.getAllProducts().call();
  console.log('\n📋 All product IDs:', allProducts.map(id => id.toString()));
  
  // Get farmer products
  const farmerProducts = await contract.methods.getFarmerProducts(accounts[0]).call();
  console.log('��‍🌾 Farmer product IDs:', farmerProducts.map(id => id.toString()));
  
  console.log('\n🎉 Contract is working perfectly!');
}

test().catch(console.error);
