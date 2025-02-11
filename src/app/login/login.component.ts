// src/app/login/login.component.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MsalService } from '@azure/msal-angular';
import { AuthenticationResult } from '@azure/msal-browser';

@Component({
  standalone: true,
  imports: [CommonModule],
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  constructor(
    private msalService: MsalService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Handle the MSAL redirect flow
    this.msalService.instance.handleRedirectPromise().then((res: AuthenticationResult | null) => {
      if (res?.account) {
        this.msalService.instance.setActiveAccount(res.account);
        this.router.navigate(['/app']);
      }
    });
  }

  login() {
    this.msalService.loginRedirect();
  }
}
