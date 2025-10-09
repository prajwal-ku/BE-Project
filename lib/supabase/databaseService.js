import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

export class DatabaseService {
  
  // Create farmer profile if not exists
  static async createFarmerProfile(userId, email) {
    try {
      // Check if profile already exists
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (!existingProfile) {
        // Create new farmer profile
        const { data: profile, error } = await supabase
          .from('profiles')
          .insert([
            {
              id: userId,
              role: 'farmer',
              email: email,
              business_name: `${email.split('@')[0]} Farms`,
              verified: true,
              created_at: new Date().toISOString()
            }
          ])
          .select()
          .single();

        if (error) throw error;
        return profile;
      }

      return existingProfile;
    } catch (error) {
      console.error('Error creating farmer profile:', error);
      throw error;
    }
  }

  // Register product in database
  static async registerProduct(productData) {
    try {
      const { data: product, error } = await supabase
        .from('products')
        .insert([
          {
            farmer_id: productData.farmerId,
            product_name: productData.productType,
            category: 'agricultural',
            harvest_date: productData.harvestDate || new Date().toISOString().split('T')[0],
            quality_metrics: { grade: productData.quality, quantity: productData.quantity },
            organic_certifications: {},
            qr_code_hash: productData.qrCode,
            description: `${productData.productType} from ${productData.farmLocation}`,
            batch_number: `batch_${Date.now()}`
          }
        ])
        .select()
        .single();

      if (error) throw error;

      // Create initial transaction
      const price = this.calculatePrice(productData.quality, productData.quantity);
      const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .insert([
          {
            product_id: product.id,
            from_user_id: '00000000-0000-0000-0000-000000000000', // system
            to_user_id: productData.farmerId,
            transaction_type: 'farm_to_distributor',
            price: price,
            quantity: productData.quantity,
            transaction_hash: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            location: productData.farmLocation,
            notes: 'Product registered by farmer',
            quality_check_passed: true
          }
        ])
        .select()
        .single();

      if (txError) throw txError;

      return {
        product: product,
        transaction: transaction
      };

    } catch (error) {
      console.error('Error registering product:', error);
      throw error;
    }
  }

  // Get farmer's products
  static async getFarmerProducts(farmerId) {
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
        .eq('farmer_id', farmerId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Format the data for frontend
      const formattedProducts = products.map(product => {
        const latestTransaction = product.transactions?.[0];
        const price = this.calculatePrice(
          product.quality_metrics?.grade || 'A',
          product.quality_metrics?.quantity || 0
        );

        return {
          productId: product.id,
          productType: product.product_name,
          quantity: `${product.quality_metrics?.quantity || 0} kg`,
          status: 'Registered',
          timestamp: product.created_at,
          currentOwner: 'Farmer',
          price: `₹${price}`,
          qrCode: product.qr_code_hash,
          farmLocation: 'Odisha Farm', // You can store this in products table if needed
          harvestDate: product.harvest_date,
          quality: product.quality_metrics?.grade || 'A',
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
      console.error('Error getting farmer products:', error);
      throw error;
    }
  }

  // Get product history
  static async getProductHistory(productId) {
    try {
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

      const history = transactions.map(tx => ({
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
        productId: product.id,
        productType: product.product_name,
        quantity: `${product.quality_metrics?.quantity || 0} kg`,
        status: this.getStatusFromTransactions(transactions),
        timestamp: product.created_at,
        currentOwner: this.getCurrentOwner(transactions),
        price: `₹${transactions[0]?.price || 0}`,
        qrCode: product.qr_code_hash,
        farmLocation: 'Odisha Farm',
        harvestDate: product.harvest_date,
        quality: product.quality_metrics?.grade || 'A',
        history: history
      };

      return formattedProduct;
    } catch (error) {
      console.error('Error getting product history:', error);
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

      return products.map(product => {
        const latestTransaction = product.transactions?.[0];
        const price = this.calculatePrice(
          product.quality_metrics?.grade || 'A',
          product.quality_metrics?.quantity || 0
        );

        return {
          productId: product.id,
          productType: product.product_name,
          quantity: `${product.quality_metrics?.quantity || 0} kg`,
          status: 'Registered',
          timestamp: product.created_at,
          currentOwner: 'Farmer',
          price: `₹${price}`,
          qrCode: product.qr_code_hash,
          history: product.transactions?.map(tx => ({
            action: this.getActionFromTransactionType(tx.transaction_type),
            by: tx.to_user?.business_name || tx.to_user?.email || 'System',
            timestamp: tx.transaction_time,
            details: tx.notes
          })) || []
        };
      });
    } catch (error) {
      console.error('Error searching products:', error);
      throw error;
    }
  }

  // Helper methods
  static calculatePrice(quality, quantity) {
    const basePrice = {
      'A': 40,
      'B': 30,
      'C': 20
    }[quality] || 25;
    
    return basePrice * quantity;
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
      const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .eq('farmer_id', farmerId);

      if (error) throw error;

      const totalRevenue = products.reduce((sum, product) => {
        const price = this.calculatePrice(
          product.quality_metrics?.grade || 'A',
          product.quality_metrics?.quantity || 0
        );
        return sum + price;
      }, 0);

      return {
        totalProducts: products.length,
        totalRevenue: totalRevenue,
        activeCrops: products.filter(p => 
          new Date(p.harvest_date) > new Date()
        ).length
      };
    } catch (error) {
      console.error('Error getting farmer stats:', error);
      throw error;
    }
  }
}