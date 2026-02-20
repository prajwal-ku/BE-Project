// lib/blockchain/chaincode-checker.js
import FabricConnection from './fabricConnection';

export async function checkChaincodeMethods() {
    try {
        console.log('🔍 Checking available chaincode methods...');
        
        await FabricConnection.connect();
        const contract = await FabricConnection.getContract();
        
        console.log('📝 Contract details:', {
            chaincodeId: contract.chaincodeId,
            channel: 'mychannel'
        });

        // Try different possible chaincode names
        const possibleChaincodes = [
            'agriculture-chaincode',
            'agritrace-chaincode', 
            'basic-chaincode'
        ];

        for (const chaincodeName of possibleChaincodes) {
            try {
                console.log(`🔄 Testing chaincode: ${chaincodeName}`);
                const network = await FabricConnection.gateway.getNetwork('mychannel');
                const testContract = network.getContract(chaincodeName);
                
                // Try to call a simple method
                const result = await testContract.evaluateTransaction('getStats');
                console.log(`✅ ${chaincodeName} is available and working`);
                console.log('📊 Stats:', JSON.parse(result.toString()));
                
                return {
                    activeChaincode: chaincodeName,
                    status: 'working'
                };
            } catch (error) {
                console.log(`❌ ${chaincodeName} not available: ${error.message}`);
            }
        }

        throw new Error('No working chaincode found');

    } catch (error) {
        console.error('❌ Chaincode check failed:', error);
        return {
            error: error.message
        };
    }
}