import { Auth0Client } from "@auth0/nextjs-auth0/server";

// Auth0 reads AUTH0_SECRET, AUTH0_BASE_URL, AUTH0_ISSUER_BASE_URL,
// AUTH0_CLIENT_ID, and AUTH0_CLIENT_SECRET from environment variables automatically.
export const auth0 = new Auth0Client();
