import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  // Start with 'light' as the default theme.
  private themeSubject = new BehaviorSubject<string>('light');
  theme$ = this.themeSubject.asObservable();

  setTheme(theme: string): void {
    this.themeSubject.next(theme);
  }

  getTheme(): string {
    return this.themeSubject.getValue();
  }
}
