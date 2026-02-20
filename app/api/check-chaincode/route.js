import { NextResponse } from 'next/server';
import FabricConnection from '@/lib/blockchain/fabricConnection';

export async function GET() {
    try {
        console.log('🔍 Checking chaincode availability...');
        
        await FabricConnection.connect();
        const contract = await FabricConnection.getContract();
        
        // Test basic methods
        const methods = ['getStats', 'registerProduct', 'getProduct'];
        const results = {};
        
        for (const method of methods) {
            try {
                const result = await contract.evaluateTransaction(method, 'test');
                results[method] = 'AVAILABLE';
            } catch (error) {
                if (error.message.includes('METHOD_NOT_FOUND')) {
                    results[method] = 'NOT_FOUND';
                } else {
                    results[method] = `ERROR: ${error.message}`;
                }
            }
        }
        
        return NextResponse.json({
            chaincode: contract.chaincodeId,
            channel: 'mychannel',
            methods: results,
            status: 'success'
        });
        
    } catch (error) {
        console.error('❌ Chaincode check failed:', error);
        return NextResponse.json({
            error: error.message,
            status: 'failed'
        }, { status: 500 });
    }
}