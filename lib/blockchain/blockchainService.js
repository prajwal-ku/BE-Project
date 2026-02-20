import { DatabaseService } from '@/lib/supabase/databaseService';
// Remove FabricConnection import
import SimulatedChain from './simulatedChain';

class BlockchainService {
  constructor() {
    this.initialized = false;
    this.blockchain = SimulatedChain; // Use simulated chain
    console.log('🟡 BlockchainService using SimulatedChain');
  }

  async initialize() {
    console.log('🔗 Initializing Blockchain Service with Simulation...');
    this.initialized = true;
    console.log('✅ Blockchain service initialized successfully (Simulation Mode)');
    return true;
  }

  // Register product - uses simulation
  async registerProduct(productData) {
    console.log('🟡 BLOCKCHAIN SERVICE - registerProduct CALLED (Simulation)');
    
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // 1. Register on Simulated Blockchain
      console.log('🔄 Registering product on Simulated Blockchain...');
      const blockchainResult = await this.blockchain.registerProduct(productData);
      console.log('✅ Product registered on simulated blockchain:', blockchainResult);

      // 2. Store in Supabase with blockchain reference
      console.log('🔄 Storing product in Supabase database...');
      
      // Ensure farmer profile exists
      await DatabaseService.createFarmerProfile(productData.farmerId, productData.farmerName);
      
      // Register product in Supabase with blockchain metadata
      const dbResult = await DatabaseService.registerProduct({
        ...productData,
        blockchainId: blockchainResult.blockchainId,
        blockchainTxHash: blockchainResult.transactionId,
        isOnBlockchain: true
      });

      console.log('✅ Product registered in Supabase:', {
        productId: dbResult.product.id,
        blockchainId: blockchainResult.blockchainId,
        transactionId: blockchainResult.transactionId
      });

      return {
        success: true,
        productId: dbResult.product.id,
        blockchainId: blockchainResult.blockchainId,
        transactionId: blockchainResult.transactionId,
        blockchainData: blockchainResult,
        databaseData: dbResult.product
      };

    } catch (error) {
      console.error('❌ Blockchain registration error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get product history from simulation
  async getProductHistory(productId) {
    console.log('🟡 BLOCKCHAIN SERVICE - getProductHistory CALLED (Simulation)');

    if (!this.initialized) {
      await this.initialize();
    }

    try {
      let blockchainHistory = null;
      let databaseProduct = null;

      // 1. Try to get from Simulated Blockchain
      try {
        console.log('🔍 Querying product history from simulated blockchain...');
        databaseProduct = await DatabaseService.getProductHistory(productId);
        
        if (databaseProduct && databaseProduct.blockchainId) {
          blockchainHistory = await this.blockchain.getProductHistory(databaseProduct.blockchainId);
          console.log('✅ Simulated blockchain history retrieved');
        }
      } catch (blockchainError) {
        console.warn('⚠️ Could not fetch from simulated blockchain:', blockchainError.message);
      }

      // 2. Get from database
      if (!databaseProduct) {
        databaseProduct = await DatabaseService.getProductHistory(productId);
      }

      return {
        success: true,
        history: databaseProduct.history,
        product: databaseProduct,
        blockchainHistory: blockchainHistory,
        isOnBlockchain: !!blockchainHistory
      };

    } catch (error) {
      console.error('❌ Product history query error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get farmer products with simulation verification
  async getFarmerProducts(farmerId) {
    console.log('🟡 BLOCKCHAIN SERVICE - getFarmerProducts CALLED (Simulation)');

    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const products = await DatabaseService.getFarmerProducts(farmerId);

      // Verify which products are in simulated blockchain
      const productsWithBlockchainStatus = await Promise.all(
        products.map(async (product) => {
          try {
            if (product.blockchainId) {
              const blockchainData = await this.blockchain.getProduct(product.blockchainId);
              return {
                ...product,
                isOnBlockchain: true,
                blockchainVerified: true
              };
            }
          } catch (error) {
            console.warn(`⚠️ Product ${product.id} not in simulated blockchain`);
          }
          return {
            ...product,
            isOnBlockchain: false
          };
        })
      );

      return {
        success: true,
        products: productsWithBlockchainStatus
      };

    } catch (error) {
      console.error('❌ Farmer products query error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Other methods remain similar but use simulation...
  async verifyOnBlockchain(productId) {
    console.log('🟡 BLOCKCHAIN SERVICE - verifyOnBlockchain CALLED (Simulation)');

    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const product = await DatabaseService.getProductHistory(productId);
      
      if (!product || !product.blockchainId) {
        return {
          verified: false,
          reason: 'No blockchain reference found'
        };
      }

      const blockchainData = await this.blockchain.getProduct(product.blockchainId);
      
      return {
        verified: true,
        blockchainData: blockchainData,
        product: product
      };

    } catch (error) {
      return {
        verified: false,
        error: error.message
      };
    }
  }

  // Get blockchain stats from simulation
  async getBlockchainStats() {
    console.log('🟡 BLOCKCHAIN SERVICE - getBlockchainStats CALLED (Simulation)');

    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const stats = await this.blockchain.getStats();
      
      return {
        network: 'Simulated Blockchain (Development)',
        database: 'Supabase PostgreSQL',
        status: 'Connected',
        blockchainStats: stats,
        lastSync: new Date().toISOString()
      };
    } catch (error) {
      return {
        network: 'Simulated Blockchain (Development)',
        database: 'Supabase PostgreSQL', 
        status: 'Simulation active',
        error: error.message,
        lastSync: new Date().toISOString()
      };
    }
  }

  // Search, farmer stats remain the same...
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
}

// Create singleton instance
const blockchainService = new BlockchainService();
export default blockchainService;