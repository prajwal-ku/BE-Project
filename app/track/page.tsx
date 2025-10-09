'use client';
import { useState } from 'react';

export default function TrackPage() {
  const [productId, setProductId] = useState('');
  const [productHistory, setProductHistory] = useState(null);

  const trackProduct = async () => {
    const response = await fetch('/api/blockchain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'getProductHistory',
        data: { productId }
      })
    });

    const result = await response.json();
    if (result.success) {
      setProductHistory(result.history);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Track Agricultural Product</h1>
      
      <div className="mt-4 flex gap-2">
        <input 
          type="text" 
          placeholder="Enter Product ID" 
          className="flex-1 p-2 border rounded"
          value={productId}
          onChange={e => setProductId(e.target.value)}
        />
        <button 
          onClick={trackProduct}
          className="bg-blue-600 text-white p-2 rounded"
        >
          Track
        </button>
      </div>

      {productHistory && (
        <div className="mt-6 p-4 border rounded">
          <h3 className="font-bold">Product Journey:</h3>
          <pre>{JSON.stringify(productHistory, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
