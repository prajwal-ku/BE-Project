const Web3 = require('web3').default;
const fs = require('fs');
const path = require('path');

const GANACHE_URL = 'http://127.0.0.1:7545';
const artifactPath = path.join(__dirname, 'artifacts', 'KrishiSetu.json');

if (!fs.existsSync(artifactPath)) {
    console.error('❌ Contract not compiled! Run: npm run compile');
    process.exit(1);
}

const contractArtifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));

async function deploy() {
    console.log('🚀 Deploying to Ganache...');
    console.log('📍 RPC URL:', GANACHE_URL);
    
    const web3 = new Web3(GANACHE_URL);
    
    try {
        const chainId = await web3.eth.getChainId();
        console.log('✅ Connected to chain ID:', chainId);
        
        const accounts = await web3.eth.getAccounts();
        console.log('📝 Deploying from:', accounts[0]);
        
        const balance = await web3.eth.getBalance(accounts[0]);
        console.log('💰 Balance:', web3.utils.fromWei(balance, 'ether'), 'ETH');
        
        let bytecode = contractArtifact.bytecode;
        if (!bytecode.startsWith('0x')) {
            bytecode = '0x' + bytecode;
        }
        
        console.log('📦 Bytecode length:', bytecode.length / 2, 'bytes');
        
        const contract = new web3.eth.Contract(contractArtifact.abi);
        
        const deployTx = contract.deploy({
            data: bytecode
        });
        
        const gasEstimate = await deployTx.estimateGas({
            from: accounts[0]
        });
        console.log('🔧 Estimated gas:', gasEstimate);
        
        const gasPrice = await web3.eth.getGasPrice();
        console.log('💰 Gas price:', web3.utils.fromWei(gasPrice, 'gwei'), 'Gwei');
        
        console.log('⏳ Deploying contract...');
        
        const deployedContract = await deployTx.send({
            from: accounts[0],
            gas: Math.floor(gasEstimate * 1.2),
            gasPrice: gasPrice
        });
        
        console.log('\n✅ Contract deployed successfully!');
        console.log('📄 Contract address:', deployedContract.options.address);
        console.log('🔗 Transaction hash:', deployedContract.transactionHash);
        
        const configPath = path.join(__dirname, '..', 'contract-config.json');
        const config = {
            contractAddress: deployedContract.options.address,
            network: 'ganache',
            rpcUrl: GANACHE_URL,
            chainId: chainId,
            deployedAt: new Date().toISOString(),
            deployerAddress: accounts[0],
            transactionHash: deployedContract.transactionHash
        };
        
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        console.log('💾 Config saved to:', configPath);
        
        const envPath = path.join(__dirname, '..', '.env.local');
        let envContent = '';
        
        if (fs.existsSync(envPath)) {
            envContent = fs.readFileSync(envPath, 'utf8');
            const lines = envContent.split('\n');
            const filteredLines = lines.filter(line => !line.startsWith('NEXT_PUBLIC_CONTRACT_ADDRESS='));
            envContent = filteredLines.join('\n');
        }
        
        envContent = `NEXT_PUBLIC_CONTRACT_ADDRESS=${deployedContract.options.address}\n${envContent}`;
        fs.writeFileSync(envPath, envContent);
        
        console.log('💾 .env.local updated');
        console.log('\n🎉 Deployment complete!');
        console.log('\n📋 Contract Address:', deployedContract.options.address);
        
        return deployedContract.options.address;
        
    } catch (error) {
        console.error('\n❌ Deployment failed:', error.message);
        process.exit(1);
    }
}

deploy();
