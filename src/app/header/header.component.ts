import { Component, OnInit } from '@angular/core';
import { ThemeService } from '../theme.service';
import { NgClass } from '@angular/common';
import { Router } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faHome } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [NgClass, FontAwesomeModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  isDark: boolean = false;
  homeIcon = faHome;

  constructor(private themeService: ThemeService, private router: Router) {}

  ngOnInit(): void {
    this.isDark = this.themeService.getTheme() === 'dark';
  }

  toggleTheme(): void {
    this.isDark = !this.isDark;
    this.themeService.setTheme(this.isDark ? 'dark' : 'light');
  }

  goHome(): void {
    // Navigate to the startup page.
    this.router.navigate(['/app/startup']);
  }
}
