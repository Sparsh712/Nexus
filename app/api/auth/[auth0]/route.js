import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request, { params }) {
  const { auth0 } = await params;
  const baseUrl = process.env.AUTH0_BASE_URL || process.env.APP_BASE_URL || request.nextUrl.origin;
  const issuerBaseUrl = process.env.AUTH0_ISSUER_BASE_URL;
  const clientId = process.env.AUTH0_CLIENT_ID;
  const clientSecret = process.env.AUTH0_CLIENT_SECRET;
  const defaultConnection = process.env.AUTH0_DEFAULT_CONNECTION;

  console.log('Auth route called:', auth0);

  try {
    // Handle login
    if (auth0 === 'login') {
      const searchParams = request.nextUrl.searchParams;
      const screenHint = searchParams.get('screen_hint');
      const connection = searchParams.get('connection') || defaultConnection;

      if (!issuerBaseUrl || !clientId) {
        return NextResponse.json({ error: 'Auth0 is not configured correctly' }, { status: 500 });
      }

      // Build Auth0 login URL
      const loginUrl = new URL('/authorize', issuerBaseUrl);
      loginUrl.searchParams.set('response_type', 'code');
      loginUrl.searchParams.set('client_id', clientId);
      loginUrl.searchParams.set('redirect_uri', `${baseUrl}/api/auth/callback`);
      loginUrl.searchParams.set('scope', 'openid profile email');

      if (screenHint === 'signup') {
        loginUrl.searchParams.set('screen_hint', 'signup');
      }

      if (connection) {
        loginUrl.searchParams.set('connection', connection);
      }

      console.log('Redirecting to Auth0:', loginUrl.toString());
      return NextResponse.redirect(loginUrl.toString());
    }

    // Handle logout
    if (auth0 === 'logout') {
      if (!issuerBaseUrl || !clientId) {
        return NextResponse.json({ error: 'Auth0 is not configured correctly' }, { status: 500 });
      }

      const logoutUrl = new URL('/v2/logout', issuerBaseUrl);
      logoutUrl.searchParams.set('client_id', clientId);
      logoutUrl.searchParams.set('returnTo', baseUrl);

      // Clear the session cookie
      const response = NextResponse.redirect(logoutUrl.toString());
      response.cookies.set('appSession', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0, // This deletes the cookie
        path: '/',
      });

      console.log('Logging out and clearing session');
      return response;
    }

    // Handle callback
    if (auth0 === 'callback') {
      const searchParams = request.nextUrl.searchParams;
      const code = searchParams.get('code');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      console.log('Callback received - code:', !!code, 'error:', error);

      if (error) {
        console.error('Auth0 callback error:', error, errorDescription);
        return NextResponse.redirect(`${baseUrl}?error=${error}&description=${encodeURIComponent(errorDescription || '')}`);
      }

      if (!code) {
        console.error('No authorization code received');
        return NextResponse.redirect(`${baseUrl}?error=no_code`);
      }

      if (!issuerBaseUrl || !clientId || !clientSecret) {
        return NextResponse.redirect(`${baseUrl}?error=invalid_auth0_config`);
      }

      try {
        console.log('Exchanging code for tokens...');

        // Exchange code for tokens
        const tokenResponse = await fetch(`${issuerBaseUrl}/oauth/token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            grant_type: 'authorization_code',
            client_id: clientId,
            client_secret: clientSecret,
            code: code,
            redirect_uri: `${baseUrl}/api/auth/callback`,
          }),
        });

        const tokens = await tokenResponse.json();
        console.log('Token response status:', tokenResponse.status);

        if (!tokenResponse.ok || tokens.error) {
          console.error('Token exchange failed:', tokens);
          throw new Error(tokens.error_description || tokens.error || 'Token exchange failed');
        }

        console.log('Tokens received, fetching user info...');

        // Get user info
        const userResponse = await fetch(`${issuerBaseUrl}/userinfo`, {
          headers: {
            'Authorization': `Bearer ${tokens.access_token}`,
          },
        });

        if (!userResponse.ok) {
          console.error('User info fetch failed:', userResponse.status);
          throw new Error('Failed to fetch user info');
        }

        const user = await userResponse.json();
        console.log('User info received:', user.email || user.sub);

        // Create session with only essential user data (tokens are too large for cookies)
        const sessionData = {
          user: {
            sub: user.sub,
            email: user.email,
            name: user.name,
            picture: user.picture,
            nickname: user.nickname,
          },
          expires_at: Date.now() + ((tokens.expires_in || 86400) * 1000),
        };

        const sessionString = JSON.stringify(sessionData);
        console.log('Session data size:', sessionString.length, 'bytes');

        // Use base64 encoding for the session cookie
        const sessionBase64 = Buffer.from(sessionString).toString('base64');
        console.log('Session base64 size:', sessionBase64.length, 'bytes');

        const response = NextResponse.redirect(baseUrl);

        // Set session cookie with base64 encoding
        response.cookies.set('appSession', sessionBase64, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: tokens.expires_in || 86400,
          path: '/',
        });

        console.log('Session cookie set successfully, redirecting to home');
        return response;

      } catch (error) {
        console.error('Callback processing error:', error);
        return NextResponse.redirect(`${baseUrl}?error=callback_error&description=${encodeURIComponent(error.message)}`);
      }
    }

    // Handle me (user profile)
    if (auth0 === 'me') {
      try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('appSession');

        console.log('Me route - has session cookie:', !!sessionCookie);

        if (!sessionCookie || !sessionCookie.value) {
          console.log('No appSession cookie found');
          return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const cookieValue = sessionCookie.value;
        console.log('Cookie value length:', cookieValue.length);
        console.log('Cookie value preview:', cookieValue.substring(0, 60));

        // Decode from base64
        const sessionString = Buffer.from(cookieValue, 'base64').toString('utf-8');
        console.log('Decoded session length:', sessionString.length);
        console.log('Decoded session preview:', sessionString.substring(0, 100));

        const sessionData = JSON.parse(sessionString);

        // Check if session is expired
        if (Date.now() > sessionData.expires_at) {
          console.log('Session expired');
          return NextResponse.json({ error: 'Session expired' }, { status: 401 });
        }

        console.log('Returning user data for:', sessionData.user.email || sessionData.user.sub);
        return NextResponse.json(sessionData.user);
      } catch (error) {
        console.error('Session parse error:', error.message);
        console.error('Full error:', error);
        return NextResponse.json({ error: 'Invalid session', details: error.message }, { status: 401 });
      }
    }

    console.log('Unknown auth route:', auth0);
    return NextResponse.json({ error: 'Route not found' }, { status: 404 });

  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}