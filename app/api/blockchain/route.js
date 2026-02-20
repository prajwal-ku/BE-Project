// app/api/blockchain/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

class DatabaseService {
  // Create or update farmer profile using existing columns
  static async ensureFarmerProfile(userId, email, farmLocation = '') {
    try {
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      const profileData = {
        id: userId,
        email: email,
        role: 'farmer',
        address: farmLocation, // Using 'address' column for farm location
        business_name: `${email?.split('@')[0] || 'Farmer'} Farms`,
        verified: true
      };

      if (!existingProfile) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .insert([profileData])
          .select()
          .single();

        if (error) throw error;
        console.log('✅ Farmer profile created');
        return profile;
      } else {
        const { data: profile, error } = await supabase
          .from('profiles')
          .update(profileData)
          .eq('id', userId)
          .select()
          .single();

        if (error) throw error;
        return profile;
      }
    } catch (error) {
      console.error('Error ensuring farmer profile:', error);
      throw error;
    }
  }

  // Register product in database
  static async registerProduct(productData) {
    try {
      console.log('🔄 Starting product registration...', {
        farmer_id: productData.farmer_id,
        product_name: productData.product_name
      });

      // Ensure farmer profile exists
      await this.ensureFarmerProfile(
        productData.farmer_id, 
        productData.farmer_email, 
        productData.farm_location
      );

      const batchNumber = productData.batch_number || `BATCH_${Date.now()}`;
      
      const productInsertData = {
        farmer_id: productData.farmer_id,
        product_name: productData.product_name,
        category: productData.category || 'Other',
        quantity: Number(productData.quantity),
        harvest_date: productData.harvest_date || null,
        farm_location: productData.farm_location,
        quality_metrics: { 
          grade: productData.quality_grade,
          quantity: productData.quantity
        },
        qr_code_hash: productData.qr_code_hash,
        batch_number: batchNumber,
        price_per_quintal: Number(productData.price_per_quintal) || 0,
        current_owner: 'Farmer',
        status: 'Registered',
        description: productData.description || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('🔄 Inserting product into database:', productInsertData);

      const { data: product, error } = await supabase
        .from('products')
        .insert([productInsertData])
        .select()
        .single();

      if (error) {
        console.error('❌ Database insertion error:', error);
        throw error;
      }

      console.log('✅ Product inserted successfully:', product.id);

      // Create initial transaction
      const transactionData = {
        product_id: product.id,
        from_user_id: productData.farmer_id,
        to_user_id: productData.farmer_id,
        transaction_type: 'REGISTRATION',
        price: productData.price_per_quintal,
        quantity: productData.quantity,
        transaction_hash: `TX_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        transaction_time: new Date().toISOString(),
        location: productData.farm_location,
        notes: `Product registration: ${productData.product_name}`,
        quality_check_passed: true,
        created_at: new Date().toISOString()
      };

      const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .insert([transactionData])
        .select()
        .single();

      if (txError) {
        console.warn('⚠️ Transaction creation failed:', txError);
      } else {
        console.log('✅ Transaction created successfully');
      }

      return {
        product: product,
        transaction: transaction
      };

    } catch (error) {
      console.error('❌ Error registering product:', error);
      throw error;
    }
  }

  // Get farmer's products
  static async getFarmerProducts(farmerId) {
    try {
      const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .eq('farmer_id', farmerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return products || [];
    } catch (error) {
      console.error('Error getting farmer products:', error);
      throw error;
    }
  }

  // Get farmer profile
  static async getFarmerProfile(farmerId) {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', farmerId)
        .single();

      if (error) throw error;
      return profile;
    } catch (error) {
      console.error('Error getting farmer profile:', error);
      throw error;
    }
  }

  // Track product by various identifiers
  static async trackProduct(trackingId) {
    try {
      console.log('🔍 Tracking product:', trackingId);
      
      if (!trackingId || trackingId.trim() === '') {
        throw new Error('Tracking ID is required');
      }

      const cleanTrackingId = trackingId.trim();

      // Try by batch number first
      let { data: product, error } = await supabase
        .from('products')
        .select(`
          *,
          transactions (
            *,
            from_user:profiles!transactions_from_user_id_fkey (email, business_name),
            to_user:profiles!transactions_to_user_id_fkey (email, business_name)
          )
        `)
        .eq('batch_number', cleanTrackingId)
        .single();

      if (error || !product) {
        console.log('🔍 Not found by batch number, trying by ID...');
        
        // Try by product ID
        const { data: productById } = await supabase
          .from('products')
          .select(`
            *,
            transactions (
              *,
              from_user:profiles!transactions_from_user_id_fkey (email, business_name),
              to_user:profiles!transactions_to_user_id_fkey (email, business_name)
            )
          `)
          .eq('id', cleanTrackingId)
          .single();

        if (productById) {
          product = productById;
        } else {
          // Try by product name (partial match)
          const { data: productsByName } = await supabase
            .from('products')
            .select(`
              *,
              transactions (
                *,
                from_user:profiles!transactions_from_user_id_fkey (email, business_name),
                to_user:profiles!transactions_to_user_id_fkey (email, business_name)
              )
            `)
            .ilike('product_name', `%${cleanTrackingId}%`)
            .limit(1);

          if (productsByName && productsByName.length > 0) {
            product = productsByName[0];
          } else {
            throw new Error(`Product not found: ${cleanTrackingId}`);
          }
        }
      }

      console.log('✅ Product found:', product.id);
      return product;

    } catch (error) {
      console.error('❌ Error tracking product:', error.message);
      throw error;
    }
  }
}

// In-memory fallback storage
let blockchainProducts = [];

export async function POST(request) {
  try {
    const { action, data } = await request.json();
    
    console.log('🔗 Blockchain API called:', { action });

    switch (action) {
      case 'registerProduct':
        try {
          // Validate required fields
          if (!data?.product_name || !data?.farmer_id || !data?.farm_location) {
            return NextResponse.json({ 
              success: false, 
              error: 'Missing required fields: product_name, farmer_id, farm_location' 
            }, { status: 400 });
          }

          const result = await DatabaseService.registerProduct(data);
          return NextResponse.json({ 
            success: true, 
            message: 'Product registered successfully',
            data: {
              productId: result.product.id,
              batchNumber: result.product.batch_number,
              productName: result.product.product_name,
              transactionId: result.transaction?.id,
              timestamp: new Date().toISOString()
            }
          });
        } catch (dbError) {
          console.error('❌ Database registration error:', dbError);
          return NextResponse.json({ 
            success: false, 
            error: dbError.message 
          }, { status: 500 });
        }

      case 'trackProduct':
        try {
          if (!data?.trackingId) {
            return NextResponse.json({ 
              success: false, 
              error: 'Tracking ID is required' 
            }, { status: 400 });
          }

          const product = await DatabaseService.trackProduct(data.trackingId);
          return NextResponse.json({ 
            success: true, 
            message: 'Product found',
            data: {
              product: product,
              transactions: product.transactions || []
            }
          });
        } catch (dbError) {
          console.error('❌ Database tracking error:', dbError.message);
          return NextResponse.json({ 
            success: false, 
            error: dbError.message 
          }, { status: 404 });
        }

      case 'getFarmerProducts':
        try {
          if (!data?.farmerId) {
            return NextResponse.json({ 
              success: false, 
              error: 'Farmer ID is required' 
            }, { status: 400 });
          }

          const products = await DatabaseService.getFarmerProducts(data.farmerId);
          return NextResponse.json({ 
            success: true, 
            message: 'Products retrieved successfully',
            data: {
              products: products 
            }
          });
        } catch (dbError) {
          console.error('Database error fetching farmer products:', dbError);
          return NextResponse.json({ 
            success: false, 
            error: dbError.message 
          });
        }

      case 'getFarmerProfile':
        try {
          if (!data?.farmerId) {
            return NextResponse.json({ 
              success: false, 
              error: 'Farmer ID is required' 
            }, { status: 400 });
          }

          const profile = await DatabaseService.getFarmerProfile(data.farmerId);
          return NextResponse.json({ 
            success: true, 
            message: 'Profile retrieved successfully',
            data: {
              profile: profile 
            }
          });
        } catch (dbError) {
          console.error('Database error getting profile:', dbError);
          return NextResponse.json({ 
            success: false, 
            error: 'Profile not found',
            data: {
              profile: null 
            }
          });
        }

      default:
        return NextResponse.json({ 
          success: false, 
          error: `Unknown action: ${action}` 
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

export async function GET() {
  try {
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id')
      .limit(1);
    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    const dbStatus = (!productsError && !profilesError) ? 'Connected' : 'Error';

    return NextResponse.json({ 
      success: true,
      message: 'Blockchain API is working',
      status: {
        database: dbStatus,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    return NextResponse.json({ 
      success: true,
      message: 'Blockchain API is working (fallback mode)',
      status: {
        database: 'Fallback mode',
        timestamp: new Date().toISOString()
      }
    });
  }
}