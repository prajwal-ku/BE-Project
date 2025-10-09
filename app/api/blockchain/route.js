import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Helper functions for database operations
class DatabaseService {
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
            quality_metrics: { 
              grade: productData.quality, 
              quantity: productData.quantity,
              farmLocation: productData.farmLocation,
              customProductId: productData.productId // Store custom ID for tracking
            },
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
            from_user_id: productData.farmerId,
            to_user_id: productData.farmerId, // Self for registration
            transaction_type: 'farm_to_distributor',
            price: price,
            quantity: productData.quantity,
            transaction_hash: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            location: productData.farmLocation,
            notes: 'Product registered by farmer on blockchain',
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

      // Format the data to match your existing frontend structure
      const formattedProducts = products.map(product => {
        const price = this.calculatePrice(
          product.quality_metrics?.grade || 'A',
          product.quality_metrics?.quantity || 0
        );

        return {
          productId: product.id, // Use the actual UUID from database
          productType: product.product_name,
          quantity: `${product.quality_metrics?.quantity || 0} kg`,
          status: 'Registered',
          timestamp: product.created_at,
          currentOwner: 'Farmer',
          price: `₹${price}/kg`,
          farmerId: product.farmer_id,
          qrCode: product.qr_code_hash,
          harvestDate: product.harvest_date,
          quality: product.quality_metrics?.grade || 'A',
          history: product.transactions?.map(tx => ({
            action: this.getActionFromTransactionType(tx.transaction_type),
            by: tx.to_user?.business_name || tx.to_user?.email || 'Farmer',
            timestamp: tx.transaction_time,
            details: tx.notes
          })) || []
        };
      });

      return formattedProducts;
    } catch (error) {
      console.error('Error getting farmer products:', error);
      throw error;
    }
  }

  // Get product history - IMPROVED SEARCH
  static async getProductHistory(productId) {
    try {
      console.log('🔍 Searching for product with ID:', productId);
      
      // First try to find by UUID (database ID)
      let { data: product, error: productError } = await supabase
        .from('products')
        .select(`
          *,
          transactions (
            *,
            from_user:profiles!transactions_from_user_id_fkey (email, business_name),
            to_user:profiles!transactions_to_user_id_fkey (email, business_name)
          )
        `)
        .eq('id', productId)
        .single();

      // If not found by UUID, try to find by custom product ID in quality_metrics
      if (productError || !product) {
        console.log('🔍 Not found by UUID, trying custom product ID...');
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
          .eq('quality_metrics->>customProductId', productId)
          .single();

        if (error || !products) {
          console.log('🔍 Not found by custom ID, trying product name...');
          // Try by product name as fallback
          const { data: nameProducts, error: nameError } = await supabase
            .from('products')
            .select(`
              *,
              transactions (
                *,
                from_user:profiles!transactions_from_user_id_fkey (email, business_name),
                to_user:profiles!transactions_to_user_id_fkey (email, business_name)
              )
            `)
            .ilike('product_name', `%${productId}%`)
            .limit(1)
            .single();

          if (nameError || !nameProducts) {
            throw new Error('Product not found');
          }
          product = nameProducts;
        } else {
          product = products;
        }
      }

      console.log('✅ Product found:', product.id);

      const price = this.calculatePrice(
        product.quality_metrics?.grade || 'A',
        product.quality_metrics?.quantity || 0
      );

      const formattedProduct = {
        productId: product.id,
        productType: product.product_name,
        quantity: `${product.quality_metrics?.quantity || 0} kg`,
        status: 'Registered',
        timestamp: product.created_at,
        currentOwner: 'Farmer',
        price: `₹${price}/kg`,
        farmerId: product.farmer_id,
        qrCode: product.qr_code_hash,
        harvestDate: product.harvest_date,
        quality: product.quality_metrics?.grade || 'A',
        history: product.transactions?.map(tx => ({
          action: this.getActionFromTransactionType(tx.transaction_type),
          by: tx.to_user?.business_name || tx.to_user?.email || 'Farmer',
          timestamp: tx.transaction_time,
          details: tx.notes
        })) || []
      };

      return formattedProduct;
    } catch (error) {
      console.error('❌ Error getting product history:', error.message);
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
        .or(`product_name.ilike.%${searchTerm}%,quality_metrics->>customProductId.ilike.%${searchTerm}%`)
        .limit(10);

      if (error) throw error;

      return products.map(product => {
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
          price: `₹${price}/kg`,
          farmerId: product.farmer_id,
          qrCode: product.qr_code_hash,
          history: product.transactions?.map(tx => ({
            action: this.getActionFromTransactionType(tx.transaction_type),
            by: tx.to_user?.business_name || tx.to_user?.email || 'Farmer',
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
}

// Simulated blockchain storage (fallback - will use database primarily)
let blockchainProducts = [];

export async function POST(request) {
  try {
    const { action, data } = await request.json();
    
    console.log('🔗 Blockchain API called:', { action });

    switch (action) {
      case 'registerProduct':
        try {
          // Ensure farmer profile exists
          await DatabaseService.createFarmerProfile(data.farmerId, data.farmerName);
          
          // Register product in REAL database
          const result = await DatabaseService.registerProduct(data);

          // Also add to simulated storage for immediate frontend response
          const newProduct = {
            productId: result.product.id, // Use the actual UUID from database
            productType: data.productType,
            quantity: `${data.quantity} kg`,
            status: "Registered",
            timestamp: new Date().toISOString(),
            currentOwner: "Farmer",
            price: "₹" + (data.quality === "A" ? "40" : data.quality === "B" ? "30" : "20") + "/kg",
            farmerId: data.farmerId,
            farmerName: data.farmerName,
            qrCode: data.qrCode,
            harvestDate: data.harvestDate,
            quality: data.quality,
            history: [
              { 
                action: "Registered", 
                by: data.farmerName || "Farmer", 
                timestamp: new Date().toISOString(),
                details: "Product registered on blockchain"
              }
            ]
          };

          blockchainProducts.push(newProduct);
          
          return NextResponse.json({ 
            success: true, 
            productId: result.product.id, // Return the actual UUID
            transactionId: result.transaction.transaction_hash,
            timestamp: new Date().toISOString()
          });

        } catch (dbError) {
          console.error('❌ Database error, using fallback:', dbError);
          
          // Fallback to simulated storage if database fails
          const newProduct = {
            productId: data.productId,
            productType: data.productType,
            quantity: `${data.quantity} kg`,
            status: "Registered",
            timestamp: new Date().toISOString(),
            currentOwner: "Farmer",
            price: "₹" + (data.quality === "A" ? "40" : data.quality === "B" ? "30" : "20") + "/kg",
            farmerId: data.farmerId,
            farmerName: data.farmerName,
            qrCode: data.qrCode,
            harvestDate: data.harvestDate,
            quality: data.quality,
            history: [
              { 
                action: "Registered", 
                by: data.farmerName || "Farmer", 
                timestamp: new Date().toISOString(),
                details: "Product registered on blockchain"
              }
            ]
          };

          blockchainProducts.push(newProduct);
          
          return NextResponse.json({ 
            success: true, 
            productId: data.productId,
            transactionId: `tx_${Date.now()}`,
            timestamp: new Date().toISOString()
          });
        }

      case 'getProductHistory':
        try {
          console.log('🔍 Tracking product:', data.productId);
          // Try database first
          const product = await DatabaseService.getProductHistory(data.productId);
          console.log('✅ Product found in database');
          return NextResponse.json({ 
            success: true, 
            history: product // Return the product data as history
          });
        } catch (dbError) {
          console.error('❌ Database error, using fallback:', dbError.message);
          
          // Fallback to simulated storage
          const product = blockchainProducts.find(p => 
            p.productId === data.productId || 
            p.qrCode?.includes(data.productId) ||
            p.productType.toLowerCase().includes(data.productId.toLowerCase())
          );
          
          if (product) {
            console.log('✅ Product found in fallback storage');
            return NextResponse.json({ 
              success: true, 
              history: product 
            });
          } else {
            console.log('❌ Product not found anywhere');
            return NextResponse.json({ 
              success: false, 
              error: 'Product not found' 
            }, { status: 404 });
          }
        }

      case 'getFarmerProducts':
        try {
          // Try database first
          const farmerProducts = await DatabaseService.getFarmerProducts(data.farmerId);
          return NextResponse.json({ 
            success: true, 
            products: farmerProducts 
          });
        } catch (dbError) {
          console.error('Database error, using fallback:', dbError);
          
          // Fallback to simulated storage
          const farmerProducts = blockchainProducts.filter(p => 
            p.farmerId === data.farmerId
          );
          
          return NextResponse.json({ 
            success: true, 
            products: farmerProducts 
          });
        }

      default:
        return NextResponse.json({ 
          success: false, 
          error: 'Unknown action' 
        }, { status: 400 });
    }
  } catch (error) {
    console.error('❌ API Route Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error: ' + error.message 
    }, { status: 500 });
  }
}

// Also add GET for testing
export async function GET() {
  try {
    // Try to get stats from database
    const { data: products, error } = await supabase
      .from('products')
      .select('*');

    if (!error) {
      return NextResponse.json({ 
        message: 'Blockchain API + Database is working',
        database: 'Connected to Supabase',
        totalProductsInDB: products.length,
        totalProductsInMemory: blockchainProducts.length
      });
    } else {
      throw error;
    }
  } catch (error) {
    return NextResponse.json({ 
      message: 'Blockchain API is working (fallback mode)',
      database: 'Using in-memory storage',
      totalProducts: blockchainProducts.length,
      products: blockchainProducts
    });
  }
}