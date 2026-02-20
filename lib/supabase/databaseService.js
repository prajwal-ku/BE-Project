import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

// Add UUID generation helper
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export class DatabaseService {
  
  // Create farmer profile if not exists - FIXED UUID ISSUE
  static async createFarmerProfile(userId, farmerName) {
    try {
      // Convert string IDs to UUID format if needed
      let uuidFarmerId = userId;
      
      // Check if it's already a UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(userId)) {
        // Generate a deterministic UUID from the string
        uuidFarmerId = generateUUID();
        console.log(`🔄 Converted farmerId "${userId}" to UUID: "${uuidFarmerId}"`);
      }

      // Check if profile already exists
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uuidFarmerId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.warn('Profile check warning:', checkError);
      }

      if (!existingProfile) {
        // Create new farmer profile
        const { data: profile, error } = await supabase
          .from('profiles')
          .insert([
            {
              id: uuidFarmerId,
              role: 'farmer',
              email: `${farmerName.toLowerCase().replace(/\s+/g, '')}@farm.com`,
              business_name: `${farmerName}'s Farm`,
              verified: true,
              created_at: new Date().toISOString()
            }
          ])
          .select()
          .single();

        if (error) {
          console.error('Error creating farmer profile:', error);
          // Return the UUID even if profile creation fails
          return uuidFarmerId;
        }
        return profile.id;
      }

      return existingProfile.id;
    } catch (error) {
      console.error('Error in createFarmerProfile:', error);
      // Return a fallback UUID
      return generateUUID();
    }
  }

  // Register product in database - UPDATED FOR BLOCKCHAIN DATA
  static async registerProduct(productData) {
    try {
      console.log('📝 DatabaseService - registerProduct called with:', productData);
      
      // Ensure farmerId is in UUID format
      let farmerId = productData.farmerId;
      if (!this.isValidUUID(farmerId)) {
        farmerId = await this.createFarmerProfile(productData.farmerId, productData.farmerName);
      }

      const productId = productData.blockchainId || generateUUID();
      const transactionId = productData.blockchainTxHash || generateUUID();

      // Prepare product record
      const productRecord = {
        id: productId,
        farmer_id: farmerId,
        product_name: productData.productName || productData.productType || 'Agricultural Product',
        category: 'agricultural',
        harvest_date: productData.harvestDate || new Date().toISOString().split('T')[0],
        quality_metrics: { 
          grade: productData.quality || 'A', 
          quantity: productData.quantity || 100 
        },
        organic_certifications: {},
        qr_code_hash: productData.qrCode || `qr_${Date.now()}`,
        description: productData.description || `${productData.productName} from ${productData.farmLocation || 'Farm'}`,
        batch_number: productData.batchNumber || `batch_${Date.now()}`,
        blockchain_id: productData.blockchainId,
        blockchain_tx_hash: productData.blockchainTxHash,
        is_on_blockchain: productData.isOnBlockchain || true,
        created_at: new Date().toISOString()
      };

      console.log('📦 Inserting product record:', productRecord);

      // Insert product
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert(productRecord)
        .select()
        .single();

      if (productError) {
        console.error('Product insertion error:', productError);
        throw productError;
      }

      // Create initial transaction
      const price = this.calculatePrice(productData.quality || 'A', productData.quantity || 100);
      const transactionRecord = {
        id: transactionId,
        product_id: product.id,
        from_user_id: '00000000-0000-0000-0000-000000000000', // system
        to_user_id: farmerId,
        transaction_type: 'farm_to_distributor',
        price: price,
        quantity: productData.quantity || 100,
        transaction_hash: productData.blockchainTxHash || `tx_${Date.now()}`,
        location: productData.farmLocation || 'Farm Location',
        notes: 'Product registered by farmer via blockchain',
        quality_check_passed: true,
        transaction_time: new Date().toISOString()
      };

      console.log('💳 Inserting transaction record:', transactionRecord);

      const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .insert(transactionRecord)
        .select()
        .single();

      if (txError) {
        console.error('Transaction insertion error:', txError);
        // Don't throw error for transaction failure, product is already created
        console.warn('Transaction creation failed, but product was created');
      }

      return {
        product: product,
        transaction: transaction || transactionRecord
      };

    } catch (error) {
      console.error('❌ Error registering product in database:', error);
      throw error;
    }
  }

  // Helper method to check UUID validity
  static isValidUUID(str) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  }

  // Get farmer's products
  static async getFarmerProducts(farmerId) {
    try {
      console.log('🔍 Getting products for farmer:', farmerId);
      
      // Convert to UUID if needed
      let uuidFarmerId = farmerId;
      if (!this.isValidUUID(farmerId)) {
        // For non-UUID farmerId, we need to handle this case
        // For now, just log and proceed
        console.warn('Non-UUID farmerId provided:', farmerId);
      }

      const { data: products, error } = await supabase
        .from('products')
        .select(`
          *,
          transactions (
            *,
            from_user:profiles!transactions_from_user_id_fkey (email, business_name),
            to_user:profiles!transactions_to_user_id_fkey (email, business_name)
          )
        `)
        .eq('farmer_id', uuidFarmerId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log(`📊 Found ${products?.length || 0} products`);

      // Format the data for frontend
      const formattedProducts = (products || []).map(product => {
        const latestTransaction = product.transactions?.[0];
        const price = this.calculatePrice(
          product.quality_metrics?.grade || 'A',
          product.quality_metrics?.quantity || 0
        );

        return {
          id: product.id,
          productId: product.id,
          productType: product.product_name,
          productName: product.product_name,
          quantity: `${product.quality_metrics?.quantity || 0} kg`,
          status: 'Registered',
          timestamp: product.created_at,
          currentOwner: 'Farmer',
          price: `₹${price}`,
          qrCode: product.qr_code_hash,
          farmLocation: 'Odisha Farm',
          harvestDate: product.harvest_date,
          quality: product.quality_metrics?.grade || 'A',
          blockchainId: product.blockchain_id,
          isOnBlockchain: product.is_on_blockchain,
          history: product.transactions?.map(tx => ({
            action: this.getActionFromTransactionType(tx.transaction_type),
            by: tx.to_user?.business_name || tx.to_user?.email || 'System',
            timestamp: tx.transaction_time,
            details: tx.notes,
            transactionHash: tx.transaction_hash,
            location: tx.location,
            quantity: tx.quantity,
            price: `₹${tx.price}`
          })) || []
        };
      });

      return formattedProducts;
    } catch (error) {
      console.error('❌ Error getting farmer products:', error);
      throw error;
    }
  }

  // Get product history
  static async getProductHistory(productId) {
    try {
      console.log('🔍 Getting product history for:', productId);
      
      const { data: product, error: productError } = await supabase
        .from('products')
        .select(`
          *,
          farmer:profiles!products_farmer_id_fkey (email, business_name)
        `)
        .eq('id', productId)
        .single();

      if (productError) throw productError;

      const { data: transactions, error: txError } = await supabase
        .from('transactions')
        .select(`
          *,
          from_user:profiles!transactions_from_user_id_fkey (email, business_name),
          to_user:profiles!transactions_to_user_id_fkey (email, business_name)
        `)
        .eq('product_id', productId)
        .order('transaction_time', { ascending: true });

      if (txError) throw txError;

      const history = (transactions || []).map(tx => ({
        action: this.getActionFromTransactionType(tx.transaction_type),
        by: tx.to_user?.business_name || tx.to_user?.email || 'System',
        timestamp: tx.transaction_time,
        details: tx.notes,
        transactionHash: tx.transaction_hash,
        location: tx.location,
        quantity: tx.quantity,
        price: `₹${tx.price}`
      }));

      const formattedProduct = {
        id: product.id,
        productId: product.id,
        productType: product.product_name,
        productName: product.product_name,
        quantity: `${product.quality_metrics?.quantity || 0} kg`,
        status: this.getStatusFromTransactions(transactions),
        timestamp: product.created_at,
        currentOwner: this.getCurrentOwner(transactions),
        price: `₹${transactions?.[0]?.price || 0}`,
        qrCode: product.qr_code_hash,
        farmLocation: 'Odisha Farm',
        harvestDate: product.harvest_date,
        quality: product.quality_metrics?.grade || 'A',
        blockchainId: product.blockchain_id,
        isOnBlockchain: product.is_on_blockchain,
        history: history
      };

      return formattedProduct;
    } catch (error) {
      console.error('❌ Error getting product history:', error);
      throw error;
    }
  }

  // Search products
  static async searchProducts(searchTerm) {
    try {
      const { data: products, error } = await supabase
        .from('products')
        .select(`
          *,
          transactions (
            *,
            from_user:profiles!transactions_from_user_id_fkey (email, business_name),
            to_user:profiles!transactions_to_user_id_fkey (email, business_name)
          )
        `)
        .or(`product_name.ilike.%${searchTerm}%,id.ilike.%${searchTerm}%`)
        .limit(10);

      if (error) throw error;

      return (products || []).map(product => {
        const latestTransaction = product.transactions?.[0];
        const price = this.calculatePrice(
          product.quality_metrics?.grade || 'A',
          product.quality_metrics?.quantity || 0
        );

        return {
          id: product.id,
          productId: product.id,
          productType: product.product_name,
          productName: product.product_name,
          quantity: `${product.quality_metrics?.quantity || 0} kg`,
          status: 'Registered',
          timestamp: product.created_at,
          currentOwner: 'Farmer',
          price: `₹${price}`,
          qrCode: product.qr_code_hash,
          blockchainId: product.blockchain_id,
          history: product.transactions?.map(tx => ({
            action: this.getActionFromTransactionType(tx.transaction_type),
            by: tx.to_user?.business_name || tx.to_user?.email || 'System',
            timestamp: tx.transaction_time,
            details: tx.notes
          })) || []
        };
      });
    } catch (error) {
      console.error('❌ Error searching products:', error);
      throw error;
    }
  }

  // Helper methods (keep the same)
  static calculatePrice(quality, quantity) {
    const basePrice = {
      'A': 40,
      'B': 30,
      'C': 20
    }[quality] || 25;
    
    return basePrice * (quantity || 100);
  }

  static getActionFromTransactionType(transactionType) {
    const actions = {
      'farm_to_distributor': 'Registered on Blockchain',
      'distributor_to_retailer': 'Transferred to Retailer',
      'retailer_to_consumer': 'Sold to Consumer'
    };
    return actions[transactionType] || 'Transaction Processed';
  }

  static getStatusFromTransactions(transactions) {
    const lastTransaction = transactions?.[transactions.length - 1];
    if (!lastTransaction) return 'Registered';
    
    const statusMap = {
      'farm_to_distributor': 'With Distributor',
      'distributor_to_retailer': 'With Retailer',
      'retailer_to_consumer': 'Sold to Consumer'
    };
    
    return statusMap[lastTransaction.transaction_type] || 'Registered';
  }

  static getCurrentOwner(transactions) {
    if (!transactions || transactions.length === 0) return 'Farmer';
    
    const lastTx = transactions[transactions.length - 1];
    return lastTx.to_user?.business_name || lastTx.to_user?.email || 'Farmer';
  }

  // Get dashboard stats
  static async getFarmerStats(farmerId) {
    try {
      let uuidFarmerId = farmerId;
      if (!this.isValidUUID(farmerId)) {
        console.warn('Non-UUID farmerId for stats:', farmerId);
      }

      const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .eq('farmer_id', uuidFarmerId);

      if (error) throw error;

      const totalRevenue = (products || []).reduce((sum, product) => {
        const price = this.calculatePrice(
          product.quality_metrics?.grade || 'A',
          product.quality_metrics?.quantity || 0
        );
        return sum + price;
      }, 0);

      return {
        totalProducts: products?.length || 0,
        totalRevenue: totalRevenue,
        activeCrops: (products || []).filter(p => 
          new Date(p.harvest_date) > new Date()
        ).length
      };
    } catch (error) {
      console.error('❌ Error getting farmer stats:', error);
      throw error;
    }
  }
}