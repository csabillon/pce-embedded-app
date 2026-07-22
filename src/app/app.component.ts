// app.component.ts
import { Component, ChangeDetectionStrategy } from '@angular/core';

import { RouterOutlet } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-root',
  template: `
    <router-outlet></router-outlet>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    RouterOutlet
]
})
export class AppComponent {
  title = 'pce-embedded-app';
}
