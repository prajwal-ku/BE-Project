import { NextResponse } from 'next/server'

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Mask keys for security
  const maskedServiceKey = serviceKey ? 
    serviceKey.substring(0, 20) + '...' + serviceKey.substring(serviceKey.length - 10) : 
    'MISSING';
  
  const maskedAnonKey = anonKey ? 
    anonKey.substring(0, 20) + '...' + anonKey.substring(anonKey.length - 10) : 
    'MISSING';

  return NextResponse.json({
    environment: process.env.NODE_ENV,
    hasSupabaseUrl: !!supabaseUrl,
    supabaseUrl: supabaseUrl,
    hasServiceKey: !!serviceKey,
    serviceKeyLength: serviceKey ? serviceKey.length : 0,
    maskedServiceKey: maskedServiceKey,
    hasAnonKey: !!anonKey,
    anonKeyLength: anonKey ? anonKey.length : 0,
    maskedAnonKey: maskedAnonKey,
    allEnvKeys: Object.keys(process.env).filter(key => key.includes('SUPABASE'))
  });
}