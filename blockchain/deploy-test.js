const Web3 = require('web3').default;
const fs = require('fs');
const path = require('path');
const solc = require('solc');

async function deployTest() {
    console.log('🧪 Deploying test contract...');
    
    // Compile test contract
    const source = fs.readFileSync(path.join(__dirname, 'contracts', 'TestContract.sol'), 'utf8');
    
    const input = {
        language: 'Solidity',
        sources: { 'TestContract.sol': { content: source } },
        settings: { outputSelection: { '*': { '*': ['*'] } } }
    };
    
    const output = JSON.parse(solc.compile(JSON.stringify(input)));
    const contract = output.contracts['TestContract.sol']['TestContract'];
    
    if (!contract) {
        console.error('❌ Compilation failed');
        process.exit(1);
    }
    
    const web3 = new Web3('http://127.0.0.1:7545');
    const accounts = await web3.eth.getAccounts();
    
    console.log('Deploying from:', accounts[0]);
    
    const testContract = new web3.eth.Contract(contract.abi);
    
    const result = await testContract.deploy({
        data: contract.evm.bytecode.object
    }).send({
        from: accounts[0],
        gas: 1000000
    });
    
    console.log('✅ Test contract deployed at:', result.options.address);
    
    // Test the contract
    const value = await result.methods.getValue().call();
    console.log('Initial value:', value.toString());
    
    await result.methods.setValue(42).send({ from: accounts[0] });
    const newValue = await result.methods.getValue().call();
    console.log('New value:', newValue.toString());
    
    console.log('✅ Test contract works!');
}

deployTest().catch(console.error);
