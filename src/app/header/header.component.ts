import { Component } from '@angular/core';
import { ThemeService } from '../theme.service';

@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  selectedTheme: string;
  constructor(private themeService: ThemeService) {
    this.selectedTheme = this.themeService.getTheme();
  }
  
  onThemeChange(event: Event): void {
    const selectEl = event.target as HTMLSelectElement;
    this.selectedTheme = selectEl.value;
    this.themeService.setTheme(selectEl.value);
  }
}
