// compile.js
const fs = require('fs');
const path = require('path');
const solc = require('solc');

// Read the contract file
const contractPath = path.join(__dirname, 'contracts', 'KrishiSetu.sol');
const source = fs.readFileSync(contractPath, 'utf8');

// Compile the contract
const input = {
  language: 'Solidity',
  sources: {
    'KrishiSetu.sol': {
      content: source
    }
  },
  settings: {
    outputSelection: {
      '*': {
        '*': ['*']
      }
    }
  }
};

const output = JSON.parse(solc.compile(JSON.stringify(input)));

// Check for errors
if (output.errors) {
  output.errors.forEach(error => {
    console.error(error.formattedMessage);
  });
}

// Get the contract
const contract = output.contracts['KrishiSetu.sol']['KrishiSetu'];

// Save ABI and Bytecode
const artifactsDir = path.join(__dirname, 'artifacts');
if (!fs.existsSync(artifactsDir)) {
  fs.mkdirSync(artifactsDir);
}

fs.writeFileSync(
  path.join(artifactsDir, 'KrishiSetu.json'),
  JSON.stringify({
    abi: contract.abi,
    bytecode: contract.evm.bytecode.object,
    deployedBytecode: contract.evm.deployedBytecode.object
  }, null, 2)
);

console.log('✅ Contract compiled successfully!');
console.log('📄 ABI and Bytecode saved to artifacts/KrishiSetu.json');