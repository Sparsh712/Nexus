import { Auth0Client } from '@auth0/nextjs-auth0/server';

// Initialize Auth0 server instance
export const auth0 = new Auth0Client();

export default auth0;