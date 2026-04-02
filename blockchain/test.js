// For Web3 v4.x
const Web3 = require('web3').default;
const fs = require('fs');
const path = require('path');

const GANACHE_URL = 'http://127.0.0.1:7545';
const configPath = path.join(__dirname, '..', 'contract-config.json');

async function test() {
    console.log('🧪 Testing blockchain connection...\n');
    
    const web3 = new Web3(GANACHE_URL);
    
    // Test Ganache connection
    try {
        const isListening = await web3.eth.net.isListening();
        console.log('✅ Ganache connection:', isListening ? 'OK' : 'Failed');
        
        const chainId = await web3.eth.getChainId();
        console.log('🔗 Chain ID:', chainId);
        
        const accounts = await web3.eth.getAccounts();
        console.log('📝 Accounts found:', accounts.length);
        console.log('   First account:', accounts[0]);
        
        const balance = await web3.eth.getBalance(accounts[0]);
        console.log('💰 Balance:', web3.utils.fromWei(balance, 'ether'), 'ETH');
        
    } catch (error) {
        console.log('❌ Ganache connection failed:', error.message);
        console.log('\nStart Ganache with:');
        console.log('  npx ganache --port 7545');
        return;
    }
    
    // Test contract deployment
    if (!fs.existsSync(configPath)) {
        console.log('\n❌ Contract not deployed yet!');
        console.log('Run: npm run deploy');
        return;
    }
    
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    console.log('\n📄 Contract config found:');
    console.log('   Address:', config.contractAddress);
    console.log('   Deployed at:', config.deployedAt);
    
    // Try to interact with the deployed contract
    const artifactPath = path.join(__dirname, 'artifacts', 'KrishiSetu.json');
    if (fs.existsSync(artifactPath)) {
        const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
        const contract = new web3.eth.Contract(artifact.abi, config.contractAddress);
        
        try {
            // Try to call a view function
            const counter = await contract.methods.productCounter().call();
            console.log('\n✅ Contract is working!');
            console.log('   Product counter:', counter.toString());
            console.log('   Contract ABI is valid');
        } catch (error) {
            console.log('\n⚠️ Contract exists but call failed:', error.message);
            console.log('   Make sure the contract address is correct');
        }
    }
    
    console.log('\n✨ Test complete!');
}

test().catch(console.error);