// src/main.ts

import { bootstrapApplication } from '@angular/platform-browser';
import { importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';

import {
  PublicClientApplication,
  BrowserCacheLocation,
  InteractionType
} from '@azure/msal-browser';

import {
  MsalModule,
  MsalService,
  MsalGuard,
  MsalBroadcastService,
  MsalInterceptor,
  MsalGuardConfiguration,
  MsalInterceptorConfiguration
} from '@azure/msal-angular';

import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';

// 1) Create your PublicClientApplication (no "system.initializeOnStart")
const msalInstance = new PublicClientApplication({
  auth: {
    clientId: '63e108a4-fe47-4cf3-ba95-cde0a5effc50',
    authority: 'https://login.microsoftonline.com/41ff26dc-250f-4b13-8981-739be8610c21',
    redirectUri: 'http://localhost:4200'
  },
  cache: {
    cacheLocation: BrowserCacheLocation.LocalStorage,
    storeAuthStateInCookie: false
  }
});

// 2) MSAL Guard Config
const msalGuardConfig: MsalGuardConfiguration = {
  interactionType: InteractionType.Redirect,
  authRequest: {
    scopes: ['user.read']
  }
};

// 3) MSAL Interceptor Config
const msalInterceptorConfig: MsalInterceptorConfiguration = {
  interactionType: InteractionType.Redirect,
  protectedResourceMap: new Map([
    ['https://graph.microsoft.com/v1.0/me', ['user.read']]
  ])
};

// 4) Async IIFE to manually initialize MSAL before Angular bootstraps
(async () => {
  try {
    // Initialize the MSAL instance
    await msalInstance.initialize();
    
    // MSAL is now ready, so bootstrap your Angular app
    await bootstrapApplication(AppComponent, {
      providers: [
        provideRouter(routes),
        provideHttpClient(withInterceptorsFromDi()),

        importProvidersFrom(
          MsalModule.forRoot(
            msalInstance,
            msalGuardConfig,
            msalInterceptorConfig
          )
        ),

        { provide: HTTP_INTERCEPTORS, useClass: MsalInterceptor, multi: true },
        MsalService,
        MsalGuard,
        MsalBroadcastService
      ]
    });
    
    console.log('Angular app bootstrapped after MSAL init');
  } catch (error) {
    console.error('Error initializing MSAL or bootstrapping app:', error);
  }
})();
