import { DatabaseService } from '@/lib/supabase/databaseService';

class BlockchainService {
  constructor() {
    this.initialized = false;
  }

  async initialize() {
    console.log('🔗 Initializing blockchain with Supabase database...');
    this.initialized = true;
    console.log('✅ Blockchain connected to Supabase successfully');
    return true;
  }

  // Register product on blockchain (now stores in Supabase)
  async registerProduct(productData) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // First, ensure farmer profile exists
      await DatabaseService.createFarmerProfile(productData.farmerId, productData.farmerName);
      
      // Register product in Supabase
      const result = await DatabaseService.registerProduct(productData);

      console.log('✅ Product registered in Supabase:', {
        productId: result.product.id,
        transactionId: result.transaction.transaction_hash
      });

      return {
        success: true,
        productId: result.product.id,
        transactionId: result.transaction.transaction_hash,
        data: result.product
      };

    } catch (error) {
      console.error('❌ Blockchain registration error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get product history from Supabase
  async getProductHistory(productId) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const product = await DatabaseService.getProductHistory(productId);

      return {
        success: true,
        history: product.history,
        product: product
      };

    } catch (error) {
      console.error('❌ Blockchain query error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get all products for a farmer from Supabase
  async getFarmerProducts(farmerId) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const products = await DatabaseService.getFarmerProducts(farmerId);

      return {
        success: true,
        products: products
      };

    } catch (error) {
      console.error('❌ Blockchain query error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Search products in Supabase
  async searchProducts(searchTerm) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const products = await DatabaseService.searchProducts(searchTerm);

      return {
        success: true,
        products: products
      };

    } catch (error) {
      console.error('❌ Search error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get farmer stats from Supabase
  async getFarmerStats(farmerId) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const stats = await DatabaseService.getFarmerStats(farmerId);

      return {
        success: true,
        stats: stats
      };

    } catch (error) {
      console.error('❌ Stats error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get blockchain stats (now from Supabase)
  getBlockchainStats() {
    return {
      network: 'AgriTrace Blockchain + Supabase',
      database: 'PostgreSQL',
      storage: 'Persistent',
      lastSync: new Date().toISOString()
    };
  }
}

// Create singleton instance
const blockchainService = new BlockchainService();
export default blockchainService;