import { NextResponse } from 'next/server';
import FabricConnection from '@/lib/blockchain/fabricConnection';

export async function POST(request) {
  try {
    const { action } = await request.json();
    
    console.log('🔧 DEBUG Blockchain API called:', { action });

    let result;

    switch (action) {
      case 'test-connection':
        result = await testBlockchainConnection();
        break;
      
      case 'test-contract':
        result = await testContractMethods();
        break;
      
      case 'test-registration':
        result = await testProductRegistration();
        break;
      
      case 'check-existing':
        result = await checkExistingProducts();
        break;

      default:
        result = { error: 'Unknown debug action' };
    }

    console.log('🔧 DEBUG Result:', result);
    return NextResponse.json(result);

  } catch (error) {
    console.error('🔧 DEBUG Error:', error);
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
}

// Test 1: Basic connection
async function testBlockchainConnection() {
  console.log('🔧 Testing blockchain connection...');
  
  try {
    await FabricConnection.connect();
    const isConnected = FabricConnection.connected;
    
    return {
      test: 'connection',
      status: isConnected ? 'CONNECTED' : 'DISCONNECTED',
      gateway: FabricConnection.gateway ? 'EXISTS' : 'MISSING',
      wallet: FabricConnection.wallet ? 'EXISTS' : 'MISSING',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      test: 'connection',
      status: 'FAILED',
      error: error.message,
      details: 'Check if Fabric network is running and connection profile is correct'
    };
  }
}

// Test 2: Contract methods
async function testContractMethods() {
  console.log('🔧 Testing contract methods...');
  
  try {
    const contract = await FabricConnection.getContract();
    console.log('🔧 Contract obtained:', contract ? 'YES' : 'NO');
    
    return {
      test: 'contract',
      status: 'SUCCESS',
      contractName: contract.chaincodeId,
      channel: 'mychannel',
      methods: ['registerProduct', 'getProduct', 'getProductHistory', 'getStats'],
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      test: 'contract',
      status: 'FAILED',
      error: error.message,
      details: 'Check if chaincode is installed and instantiated on channel'
    };
  }
}

// Test 3: Actual product registration
async function testProductRegistration() {
  console.log('🔧 Testing product registration...');
  
  try {
    const contract = await FabricConnection.getContract();
    
    const testProduct = {
      id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      name: 'DEBUG Test Product',
      type: 'vegetable',
      farmerId: 'debug-farmer-001',
      farmerName: 'Debug Farmer',
      timestamp: new Date().toISOString()
    };

    console.log('🔧 Submitting transaction to blockchain...');
    
    const result = await contract.submitTransaction(
      'registerProduct',
      testProduct.id,
      JSON.stringify(testProduct)
    );

    const response = JSON.parse(result.toString());
    
    return {
      test: 'registration',
      status: 'SUCCESS',
      productId: testProduct.id,
      blockchainResponse: response,
      transactionSubmitted: true,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      test: 'registration',
      status: 'FAILED',
      error: error.message,
      transactionSubmitted: false,
      details: 'Check chaincode method signature and parameters'
    };
  }
}

// Test 4: Check existing products in blockchain
async function checkExistingProducts() {
  console.log('🔧 Checking existing products in blockchain...');
  
  try {
    const contract = await FabricConnection.getContract();
    const statsResult = await contract.evaluateTransaction('getStats');
    const stats = JSON.parse(statsResult.toString());
    
    return {
      test: 'existing-data',
      status: 'SUCCESS',
      blockchainStats: stats,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      test: 'existing-data',
      status: 'FAILED',
      error: error.message,
      details: 'Chaincode might not have getStats method'
    };
  }
}