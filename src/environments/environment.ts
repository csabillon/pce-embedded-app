// src/environments/environment.ts

export const environment = {
  production: false,
  azureAd: {
    clientId: '63e108a4-fe47-4cf3-ba95-cde0a5effc50', // Your App Registration's Client ID
    authority: 'https://login.microsoftonline.com/41ff26dc-250f-4b13-8981-739be8610c21', // Single-tenant authority with your Tenant ID
    redirectUri: 'http://localhost:4200' // Must match a registered SPA redirect URI
  }
};
