import { Routes } from '@angular/router';
import { MsalGuard } from '@azure/msal-angular';
import { LoginComponent } from './login/login.component';
import { MainLayoutComponent } from './main-layout/main-layout.component';
import { DashboardPageComponent } from './dashboard-page/dashboard-page.component';

export const routes: Routes = [
  // Public login route remains unchanged.
  { path: 'login', component: LoginComponent },
  
  // Protected area: the MainLayoutComponent wraps all authenticated pages.
  // Here, the route 'd' will load the main layout,
  // and its default child route (an empty path) will load the DashboardPageComponent.
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [MsalGuard],
    children: [
      { path: '', component: DashboardPageComponent, pathMatch: 'full' }
    ]
  },
  
  // Any unknown path redirects to login.
  { path: '**', redirectTo: 'login', pathMatch: 'full' },
];
