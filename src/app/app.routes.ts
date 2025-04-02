import { Routes } from '@angular/router';
import { MsalGuard } from '@azure/msal-angular';
import { LoginComponent } from './login/login.component';
import { MainLayoutComponent } from './main-layout/main-layout.component';
import { DashboardPageComponent } from './dashboard-page/dashboard-page.component';
import { StartupPageComponent } from './startup-page/startup-page.component';

export const routes: Routes = [
  // Public login route remains unchanged.
  { path: 'login', component: LoginComponent },
  
  // Protected area: MainLayoutComponent wraps all authenticated pages.
  {
    path: 'app',
    component: MainLayoutComponent,
    canActivate: [MsalGuard],
    children: [
      // Startup page: Displayed as the home/startup view with the map.
      { path: 'startup', component: StartupPageComponent },
      // Default child: BOP Stack dashboard.
      { path: 'bopstack', component: DashboardPageComponent, pathMatch: 'full' },
      // Regulators route.
      {
        path: 'regulators',
        component: DashboardPageComponent,
        data: {
          baseGrafanaUrl: 'http://grafana/d/{rig}_REG/regulators?orgId=1&from=now-6h&to=now&timezone=browser&refresh=auto&kiosk&panelId=1'
        }
      },
      // Analogs route.
      {
        path: 'analogs',
        component: DashboardPageComponent,
        data: {
          baseGrafanaUrl: 'http://grafana/d/{rig}_ANA/analogs?orgId=1&from=now-6h&to=now&timezone=browser&refresh=auto&kiosk&panelId=1'
        }
      },
      // Subsea route.
      {
        path: 'subsea',
        component: DashboardPageComponent,
        data: {
          baseGrafanaUrl: 'http://grafana/d/{rig}_SUB/subsea?orgId=1&from=now-6h&to=now&timezone=browser&refresh=auto&kiosk&panelId=1'
        }
      }
    ]
  },
  
  // Redirect any unknown paths to /login.
  { path: '**', redirectTo: 'login', pathMatch: 'full' }
];
