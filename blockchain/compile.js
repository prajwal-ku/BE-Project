const fs = require('fs');
const path = require('path');
const solc = require('solc');

const artifactsDir = path.join(__dirname, 'artifacts');
if (!fs.existsSync(artifactsDir)) {
    fs.mkdirSync(artifactsDir, { recursive: true });
}

const contractPath = path.join(__dirname, 'contracts', 'KrishiSetu.sol');

if (!fs.existsSync(contractPath)) {
    console.error('❌ Contract file not found:', contractPath);
    console.log('Make sure KrishiSetu.sol is in blockchain/contracts/');
    process.exit(1);
}

const source = fs.readFileSync(contractPath, 'utf8');

console.log('📄 Compiling:', contractPath);

const input = {
    language: 'Solidity',
    sources: {
        'KrishiSetu.sol': { content: source }
    },
    settings: {
        outputSelection: {
            '*': { '*': ['*'] }
        }
    }
};

const output = JSON.parse(solc.compile(JSON.stringify(input)));

let hasError = false;
if (output.errors) {
    output.errors.forEach(error => {
        if (error.severity === 'error') {
            console.error('❌ Compilation Error:', error.formattedMessage);
            hasError = true;
        } else {
            console.warn('⚠️ Warning:', error.formattedMessage);
        }
    });
}

if (hasError) {
    process.exit(1);
}

const contract = output.contracts['KrishiSetu.sol']['KrishiSetu'];

if (!contract) {
    console.error('❌ Contract not found in compiled output');
    process.exit(1);
}

const artifactPath = path.join(artifactsDir, 'KrishiSetu.json');
fs.writeFileSync(artifactPath, JSON.stringify({
    abi: contract.abi,
    bytecode: contract.evm.bytecode.object,
    deployedBytecode: contract.evm.deployedBytecode.object,
    contractName: 'KrishiSetu',
    compiler: {
        version: solc.version()
    }
}, null, 2));

console.log('✅ Compiled successfully!');
console.log('📄 Saved to:', artifactPath);
console.log('📊 Contract size:', (contract.evm.bytecode.object.length / 2), 'bytes');