// Test Web3 import
console.log('Testing Web3 v4 import...');

try {
    // Try different import methods
    const Web3Default = require('web3').default;
    console.log('✅ require(\'web3\').default works:', typeof Web3Default);
    
    const web3 = new Web3Default('http://127.0.0.1:7545');
    console.log('✅ Web3 instance created');
    
    (async () => {
        const version = await web3.eth.getProtocolVersion();
        console.log('✅ Web3 version:', version);
        console.log('✅ Web3 is working correctly!');
    })();
    
} catch (e) {
    console.log('❌ Error with .default:', e.message);
    
    // Try alternative
    try {
        const Web3Alt = require('web3');
        console.log('✅ require(\'web3\') works:', typeof Web3Alt);
        
        const web3 = new Web3Alt('http://127.0.0.1:7545');
        console.log('✅ Web3 instance created');
        
        (async () => {
            const version = await web3.eth.getProtocolVersion();
            console.log('✅ Web3 version:', version);
        })();
        
    } catch (e2) {
        console.log('❌ Error with require(\'web3\'):', e2.message);
        console.log('\nTry reinstalling web3:');
        console.log('npm uninstall web3');
        console.log('npm install web3@4.16.0');
    }
}