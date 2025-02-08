import { Component, OnInit, OnDestroy } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { ThemeService } from '../theme.service';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  templateUrl: './dashboard-page.component.html',
  styleUrls: ['./dashboard-page.component.css']
})
export class DashboardPageComponent implements OnInit, OnDestroy {

  grafanaSafeUrl: SafeResourceUrl | null = null;
  // Assumed native resolution for the Grafana dashboard (QHD)
  baseWidth: number = 2560;
  baseHeight: number = 1440;
  // Computed scale factor
  scaleFactor: number = 1;
  
  // Offsets for fine-tuning the iframe position:
  // xOffset: horizontal adjustment in pixels (positive moves right)
  // yOffset: vertical adjustment in pixels (positive moves down)
  xOffset: number = 0;
  yOffset: number = 10;  // Adjust this value as needed to ensure top controls are visible

  private themeSubscription!: Subscription;

  // Base URL for your Grafana dashboard.
  private baseGrafanaUrl: string =
    'http://localhost:3000/d/bebkljiu19vcwf/bop-stack?orgId=1&from=now-30m&to=now&timezone=browser&refresh=5s';

  constructor(
    private sanitizer: DomSanitizer,
    private themeService: ThemeService
  ) {}

  ngOnInit(): void {
    // Subscribe to theme changes from the global ThemeService.
    this.themeSubscription = this.themeService.theme$.subscribe(theme => {
      this.updateGrafanaUrl(theme);
    });
    this.calculateScaleFactor();
    window.addEventListener('resize', this.calculateScaleFactor.bind(this));
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.calculateScaleFactor.bind(this));
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe();
    }
  }

  updateGrafanaUrl(theme: string): void {
    // Append the current theme and kiosk parameters (to hide Grafana's native header)
    const url = `${this.baseGrafanaUrl}&theme=${theme}&kiosk`;
    this.grafanaSafeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
    console.log('Updated Grafana URL:', url);
  }

  calculateScaleFactor(): void {
    // Available height: window height minus header (60px) and footer (40px)
    // Available width: window width minus sidebar width (220px)
    const availableHeight = window.innerHeight - 60 - 40;
    const availableWidth = window.innerWidth - 220;
    this.scaleFactor = Math.min(availableWidth / this.baseWidth, availableHeight / this.baseHeight);
  }
}
