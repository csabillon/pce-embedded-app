// app.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-root',
  template: `
    <router-outlet></router-outlet>
  `,
  imports: [
    CommonModule,
    RouterOutlet
  ]
})
export class AppComponent {
  title = 'pce-embedded-app';
}
