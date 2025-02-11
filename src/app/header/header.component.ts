import { Component, OnInit } from '@angular/core';
import { ThemeService } from '../theme.service';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [NgClass], 
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  isDark: boolean = false;

  constructor(private themeService: ThemeService) {}

  ngOnInit(): void {
    // Initialize based on the current theme from ThemeService.
    this.isDark = this.themeService.getTheme() === 'dark';
  }

  toggleTheme(): void {
    // Toggle the theme and update the ThemeService.
    this.isDark = !this.isDark;
    this.themeService.setTheme(this.isDark ? 'dark' : 'light');
  }
}
