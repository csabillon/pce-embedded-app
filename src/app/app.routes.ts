// app.routes.ts
import { Routes } from '@angular/router';
import { MsalGuard } from '@azure/msal-angular';
import { LoginComponent } from './login/login.component';
import { MainLayoutComponent } from './main-layout/main-layout.component';
import { DashboardPageComponent } from './dashboard-page/dashboard-page.component';
import { StartupPageComponent } from './startup-page/startup-page.component';
import { StreamlitEmbedComponent } from './streamlit-embed/streamlit-embed.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },

  {
    path: 'app',
    component: MainLayoutComponent,
    canActivate: [MsalGuard],
    children: [
      { path: 'startup', component: StartupPageComponent },
      { path: 'bopstack', component: DashboardPageComponent, pathMatch: 'full' },

      {
        path: 'regulators',
        component: DashboardPageComponent,
        data: {
          baseGrafanaUrl:
            'http://grafana/d/{rig}_REG/regulators?orgId=1&from=now-7d&to=now&timezone=browser&refresh=auto&kiosk&panelId=1'
        }
      },
      {
        path: 'analogs',
        component: DashboardPageComponent,
        data: {
          baseGrafanaUrl:
            'http://grafana/d/{rig}_ANA/analogs?orgId=1&from=now-7d&to=now&timezone=browser&refresh=auto&kiosk&panelId=1'
        }
      },
      {
        path: 'subsea',
        component: DashboardPageComponent,
        data: {
          baseGrafanaUrl:
            'http://grafana/d/{rig}_SUB/subsea?orgId=1&from=now-7d&to=now&timezone=browser&refresh=auto&kiosk&panelId=1'
        }
      },
      {
        path: 'surface',
        component: DashboardPageComponent,
        data: {
          baseGrafanaUrl:
            'http://grafana/d/{rig}_SUR/subsea?orgId=1&from=now-7d&to=now&timezone=browser&refresh=auto&kiosk&panelId=1'
        }
      },

      // Streamlit Analytics (page names must match Streamlit's available_pages)
      { path: 'analytics/valve-analytics',   component: StreamlitEmbedComponent, data: { page: 'Valve Analytics' } },
      { path: 'analytics/pods-overview',     component: StreamlitEmbedComponent, data: { page: 'Pods Overview' } },
      { path: 'analytics/eds-cycles',        component: StreamlitEmbedComponent, data: { page: 'EDS Cycles' } },
      { path: 'analytics/pressure-cycles',   component: StreamlitEmbedComponent, data: { page: 'Pressure Cycles' } },
      { path: 'analytics/trends',            component: StreamlitEmbedComponent, data: { page: 'Trends' } },

      // FIX: typo 'vave-analytics' -> 'valve-analytics'
      { path: 'analytics', redirectTo: 'analytics/valve-analytics', pathMatch: 'full' }
    ]
  },

  { path: '**', redirectTo: 'login', pathMatch: 'full' }
];
