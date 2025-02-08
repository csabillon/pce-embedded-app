// app.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-root',
  template: `
    <!-- Show other root-level content if you want -->
    <router-outlet></router-outlet>
  `,
  // Must statically include RouterOutlet in the imports array
  imports: [
    CommonModule,
    RouterOutlet
  ]
})
export class AppComponent {}
