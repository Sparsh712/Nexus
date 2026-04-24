import { NextResponse } from 'next/server';

export async function GET(request) {
  const cookieHeader = request.headers.get('cookie');
  
  return NextResponse.json({
    hasCookies: !!cookieHeader,
    cookies: cookieHeader || 'None',
    env: {
      hasBaseUrl: !!process.env.AUTH0_BASE_URL,
      hasIssuerUrl: !!process.env.AUTH0_ISSUER_BASE_URL,
      hasClientId: !!process.env.AUTH0_CLIENT_ID,
      hasClientSecret: !!process.env.AUTH0_CLIENT_SECRET && process.env.AUTH0_CLIENT_SECRET !== 'REPLACE_THIS_WITH_YOUR_ACTUAL_CLIENT_SECRET_FROM_AUTH0_DASHBOARD',
      clientSecretLength: process.env.AUTH0_CLIENT_SECRET?.length || 0,
    }
  });
}