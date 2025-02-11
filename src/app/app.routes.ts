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
      // New regulators route: pass the regulators URL via route data.
      {
        path: 'regulators',
        component: DashboardPageComponent,
        data: {
          baseGrafanaUrl: 'http://localhost:3000/d/eeazp1y1a86bkd/regulators?orgId=1&from=now-1h&to=now&timezone=browser&refresh=auto'
        }
      },
      {
        path: 'analogs',
        component: DashboardPageComponent,
        data: {
          baseGrafanaUrl: 'http://localhost:3000/d/deazfskabc0e8e/analogs?orgId=1&from=now-1h&to=now&timezone=browser&refresh=auto'
        }
      }
    ]
  },
  
  // Redirect any unknown paths to /login.
  { path: '**', redirectTo: 'login', pathMatch: 'full' }
];
