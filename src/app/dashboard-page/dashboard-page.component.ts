import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { ThemeService } from '../theme.service';
import { ActivatedRoute } from '@angular/router';

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
  
  // Offsets for fine-tuning the iframe position
  xOffset: number = 0;
  yOffset: number = 10;  // Adjust as needed
  
  private themeSubscription!: Subscription;
  
  // Make baseGrafanaUrl an input with a default value
  @Input() baseGrafanaUrl: string =
    'http://localhost:3000/d/bebkljiu19vcwf/bop-stack?orgId=1&from=now-30m&to=now&timezone=browser&refresh=5s';
  
  constructor(
    private sanitizer: DomSanitizer,
    private themeService: ThemeService,
    private activatedRoute: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Check route data for an override of baseGrafanaUrl
    const routeUrl = this.activatedRoute.snapshot.data['baseGrafanaUrl'];
    if (routeUrl) {
      this.baseGrafanaUrl = routeUrl;
    }
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
    // Append the current theme and kiosk parameter.
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
