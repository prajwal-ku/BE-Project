// SIMPLE simulated blockchain - No complex setup required
class SimulatedBlockchain {
  constructor() {
    this.products = new Map();
    this.transactions = [];
  }

  // Register new agricultural product
  registerProduct(productData) {
    const productId = `prod_${Date.now()}`;
    const product = {
      productId,
      ...productData,
      timestamp: new Date().toISOString(),
      history: [{
        action: 'registered',
        by: productData.farmerId,
        timestamp: new Date().toISOString()
      }]
    };
    
    this.products.set(productId, product);
    return productId;
  }

  // Transfer product to new owner
  transferProduct(productId, from, to, price) {
    const product = this.products.get(productId);
    if (!product) throw new Error('Product not found');
    
    product.currentOwner = to;
    product.history.push({
      action: 'transferred',
      from,
      to,
      price,
      timestamp: new Date().toISOString()
    });
    
    return true;
  }

  // Get product history
  getProductHistory(productId) {
    return this.products.get(productId);
  }
}

// Create single instance
const blockchain = new SimulatedBlockchain();
export default blockchain;
