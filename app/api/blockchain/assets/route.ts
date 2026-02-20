import { NextRequest, NextResponse } from 'next/server';
import { FabricClient } from '../../../../../blockchain/lib/fabric-client';

export async function POST(request: NextRequest) {
  try {
    const { id, owner, value, timestamp } = await request.json();
    
    const fabricClient = new FabricClient();
    const { contract } = await fabricClient.connect();
    
    await contract.submitTransaction('CreateAsset', id, owner, value.toString(), timestamp);
    await fabricClient.disconnect();
    
    return NextResponse.json({ success: true, message: 'Asset created successfully' });
  } catch (error: any) {
    console.error('Error creating asset:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const fabricClient = new FabricClient();
    const { contract } = await fabricClient.connect();
    
    const result = await contract.evaluateTransaction('GetAllAssets');
    await fabricClient.disconnect();
    
    const assets = JSON.parse(result.toString());
    return NextResponse.json({ success: true, assets });
  } catch (error: any) {
    console.error('Error fetching assets:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
