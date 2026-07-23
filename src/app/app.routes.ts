// app.routes.ts
import { Routes } from '@angular/router';
import { MsalGuard } from '@azure/msal-angular';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./login/login.component').then(m => m.LoginComponent)
  },

  {
    path: 'app',
    loadComponent: () =>
      import('./main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    canActivate: [MsalGuard],
    children: [
      {
        path: 'startup',
        loadComponent: () =>
          import('./startup-page/startup-page.component').then(m => m.StartupPageComponent)
      },
      {
        path: 'bopstack',
        loadComponent: () =>
          import('./dashboard-page/dashboard-page.component').then(m => m.DashboardPageComponent),
        pathMatch: 'full'
      },

      {
        path: 'regulators',
        loadComponent: () =>
          import('./dashboard-page/dashboard-page.component').then(m => m.DashboardPageComponent),
        data: {
          baseGrafanaUrl:
            'http://grafana/d/{rig}_REG/regulators?orgId=1&from=now-7d&to=now&timezone=browser&refresh=auto&kiosk&panelId=1'
        }
      },
      {
        path: 'analogs',
        loadComponent: () =>
          import('./dashboard-page/dashboard-page.component').then(m => m.DashboardPageComponent),
        data: {
          baseGrafanaUrl:
            'http://grafana/d/{rig}_ANA/analogs?orgId=1&from=now-7d&to=now&timezone=browser&refresh=auto&kiosk&panelId=1'
        }
      },
      {
        path: 'subsea',
        loadComponent: () =>
          import('./dashboard-page/dashboard-page.component').then(m => m.DashboardPageComponent),
        data: {
          baseGrafanaUrl:
            'http://grafana/d/{rig}_SUB/subsea?orgId=1&from=now-7d&to=now&timezone=browser&refresh=auto&kiosk&panelId=1'
        }
      },
      {
        path: 'surface',
        loadComponent: () =>
          import('./dashboard-page/dashboard-page.component').then(m => m.DashboardPageComponent),
        data: {
          baseGrafanaUrl:
            'http://grafana/d/{rig}_SUR/subsea?orgId=1&from=now-7d&to=now&timezone=browser&refresh=auto&kiosk&panelId=1'
        }
      },

      // One reusable route keeps the Streamlit embed component mounted while
      // switching between analytics pages; the component maps the slug to the
      // Streamlit page query parameter.
      {
        path: 'analytics/:analyticsPage',
        loadComponent: () =>
          import('./streamlit-embed/streamlit-embed.component').then(m => m.StreamlitEmbedComponent)
      },

      // FIX: typo 'vave-analytics' -> 'valve-analytics'
      { path: 'analytics', redirectTo: 'analytics/valve-analytics', pathMatch: 'full' }
    ]
  },

  { path: '**', redirectTo: 'login', pathMatch: 'full' }
];
