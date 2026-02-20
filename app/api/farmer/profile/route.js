import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Profile API - Supabase URL:', supabaseUrl ? '✓ Present' : '✗ Missing');
console.log('Profile API - Supabase Service Key:', supabaseKey ? '✓ Present' : '✗ Missing');

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables in profile API');
  throw new Error('Supabase configuration is missing');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// GET - Get profile by ID
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      throw new Error('Profile ID is required');
    }

    console.log('🟡 Getting profile for ID:', id.substring(0, 8) + '...');

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    // If no profile exists, return 404
    if (error && error.code === 'PGRST116') {
      console.log('🟡 No profile found');
      return NextResponse.json({ 
        success: false, 
        error: 'Profile not found' 
      }, { status: 404 });
    }
    
    if (error) {
      console.error('🔴 Profile query error:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    console.log('🟢 Found profile');

    return NextResponse.json({ 
      success: true, 
      profile: data 
    });

  } catch (error) {
    console.error('🔴 Get profile error:', error.message);
    return NextResponse.json({ 
      success: false, 
      error: error.message
    }, { status: 500 });
  }
}

// POST - Create new profile (FIXED VERSION)
export async function POST(request) {
  try {
    const { role, email, phone, address, business_name } = await request.json();
    
    if (!role || !email) {
      throw new Error('Role and email are required fields');
    }

    console.log('🟡 Creating profile for email:', email);

    // FIRST: Check if profile already exists with this email
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();

    // If profile exists, return it instead of creating new one
    if (existingProfile) {
      console.log('🟡 Profile already exists, returning existing profile');
      return NextResponse.json({ 
        success: true, 
        profile: existingProfile 
      });
    }

    // If check error is NOT "not found", then it's a real error
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('🔴 Profile check error:', checkError);
      throw new Error(`Database error: ${checkError.message}`);
    }

    // Only create new profile if it doesn't exist
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        role: role,
        email: email,
        phone: phone || '',
        address: address || '',
        business_name: business_name || '',
        verified: false
      })
      .select()
      .single();

    if (error) {
      console.error('🔴 Profile creation error:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    console.log('🟢 Profile created successfully');

    return NextResponse.json({ 
      success: true, 
      profile: data 
    }, { status: 201 });

  } catch (error) {
    console.error('🔴 Create profile error:', error.message);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

// PUT - Update profile (FIXED VERSION)
export async function PUT(request) {
  try {
    const { id, role, email, phone, address, business_name, verified } = await request.json();
    
    if (!id) {
      throw new Error('Profile ID is required');
    }

    console.log('🟡 Updating profile for ID:', id.substring(0, 8) + '...');

    // Check if profile exists first
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (checkError && checkError.code === 'PGRST116') {
      console.log('🔴 Profile not found for update');
      return NextResponse.json({ 
        success: false, 
        error: 'Profile not found' 
      }, { status: 404 });
    }
    
    if (checkError) {
      console.error('🔴 Profile check error:', checkError);
      throw new Error(`Database error: ${checkError.message}`);
    }

    // Build update object with only provided fields
    const updateData = {};
    if (role !== undefined) updateData.role = role;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (business_name !== undefined) updateData.business_name = business_name;
    if (verified !== undefined) updateData.verified = verified;

    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('🔴 Profile update error:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    console.log('🟢 Profile updated successfully');

    return NextResponse.json({ 
      success: true, 
      profile: data 
    });

  } catch (error) {
    console.error('🔴 Update profile error:', error.message);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

// PATCH - Partial update profile
export async function PATCH(request) {
  try {
    const { id, ...updateFields } = await request.json();
    
    if (!id) {
      throw new Error('Profile ID is required');
    }

    console.log('🟡 Partially updating profile for ID:', id.substring(0, 8) + '...');

    // Check if profile exists first
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', id)
      .single();

    if (checkError && checkError.code === 'PGRST116') {
      return NextResponse.json({ 
        success: false, 
        error: 'Profile not found' 
      }, { status: 404 });
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updateFields)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('🔴 Profile partial update error:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    console.log('🟢 Profile partially updated successfully');

    return NextResponse.json({ 
      success: true, 
      profile: data 
    });

  } catch (error) {
    console.error('🔴 Partial update profile error:', error.message);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

// DELETE - Delete profile
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      throw new Error('Profile ID is required');
    }

    console.log('🟡 Deleting profile for ID:', id.substring(0, 8) + '...');

    // Check if profile exists first
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', id)
      .single();

    if (checkError && checkError.code === 'PGRST116') {
      return NextResponse.json({ 
        success: false, 
        error: 'Profile not found' 
      }, { status: 404 });
    }

    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('🔴 Profile deletion error:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    console.log('🟢 Profile deleted successfully');

    return NextResponse.json({ 
      success: true, 
      message: 'Profile deleted successfully' 
    });

  } catch (error) {
    console.error('🔴 Delete profile error:', error.message);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}