import { Routes } from '@angular/router';
import { MsalGuard } from '@azure/msal-angular';
import { LoginComponent } from './login/login.component';
import { MainLayoutComponent } from './main-layout/main-layout.component';
import { DashboardPageComponent } from './dashboard-page/dashboard-page.component';

export const routes: Routes = [
  // Public login route remains unchanged.
  { path: 'login', component: LoginComponent },
  
  // Protected area: MainLayoutComponent wraps all authenticated pages.
  {
    path: 'app',
    component: MainLayoutComponent,
    canActivate: [MsalGuard],
    children: [
      // Default child: BOP Stack dashboard.
      { path: '', component: DashboardPageComponent, pathMatch: 'full' },
      // Regulators route.
      {
        path: 'regulators',
        component: DashboardPageComponent,
        data: {
          baseGrafanaUrl: 'http://localhost:3000/d/{rig}_REG/regulators?orgId=1&from=now-6h&to=now&timezone=browser&refresh=auto'
        }
      },
      // Analogs route.
      {
        path: 'analogs',
        component: DashboardPageComponent,
        data: {
          baseGrafanaUrl: 'http://localhost:3000/d/{rig}_ANA/analogs?orgId=1&from=now-6h&to=now&timezone=browser&refresh=auto'
        }
      },
      // New Subsea route.
      {
        path: 'subsea',
        component: DashboardPageComponent,
        data: {
          baseGrafanaUrl: 'http://localhost:3000/d/{rig}_SUB/subsea?orgId=1&from=now-6h&to=now&timezone=browser&refresh=auto'
        }
      }
    ]
  },
  
  // Redirect any unknown paths to /login.
  { path: '**', redirectTo: 'login', pathMatch: 'full' }
];
