import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { ThemeService } from '../theme.service';
import { ActivatedRoute } from '@angular/router';
import { NavigationService } from '../navigation.service';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  templateUrl: './dashboard-page.component.html',
  styleUrls: ['./dashboard-page.component.css']
})
export class DashboardPageComponent implements OnInit, OnDestroy {
  grafanaSafeUrl: SafeResourceUrl | null = null;
  
  // Native dashboard resolution.
  // baseWidth will be set dynamically based on the window.innerWidth.
  baseWidth: number = 2560;
  baseHeight: number = 1340;

  availableWidth: number = 0;
  availableHeight: number = 0;

  scaleX: number = 1;
  scaleY: number = 1;

  effectiveWidth: number = 0;
  effectiveHeight: number = 0;

  @Input() scrollThreshold: number = 0.8;
  scrollingEnabledX: boolean = false;
  scrollingEnabledY: boolean = false;

  private themeSubscription!: Subscription;
  private navigationSubscription!: Subscription;

  // URL template using a placeholder {rig}
  private baseGrafanaUrlTemplate: string =
    'http://localhost:3000/d/{rig}_BOP/pce-bop-stack-uid?orgId=1&from=now-30m&to=now&timezone=browser&refresh=5s';

  @Input() baseGrafanaUrl: string = this.baseGrafanaUrlTemplate;

  constructor(
    private sanitizer: DomSanitizer,
    private themeService: ThemeService,
    private activatedRoute: ActivatedRoute,
    private navigationService: NavigationService
  ) {}

  ngOnInit(): void {
    // If a route provides a Grafana URL, override the template.
    const routeUrl = this.activatedRoute.snapshot.data['baseGrafanaUrl'];
    if (routeUrl) {
      this.baseGrafanaUrlTemplate = routeUrl;
      this.baseGrafanaUrl = routeUrl;
    }

    this.themeSubscription = this.themeService.theme$.subscribe(theme => {
      this.updateGrafanaUrl(theme);
    });

    this.navigationSubscription = this.navigationService.rig$.subscribe(rig => {
      this.updateGrafanaUrlWithRig(rig);
    });

    this.calculateScaleFactors();
    window.addEventListener('resize', this.calculateScaleFactors.bind(this));
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.calculateScaleFactors.bind(this));
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe();
    }
    if (this.navigationSubscription) {
      this.navigationSubscription.unsubscribe();
    }
  }

  updateGrafanaUrl(theme: string): void {
    const url = `${this.baseGrafanaUrl}&theme=${theme}&kiosk`;
    this.grafanaSafeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  updateGrafanaUrlWithRig(rig: string): void {
    // Replace the {rig} placeholder with the selected rig.
    this.baseGrafanaUrl = this.baseGrafanaUrlTemplate.replace('{rig}', rig);
    // Update the URL with the current theme.
    this.themeService.theme$.subscribe(theme => {
      this.updateGrafanaUrl(theme);
    }).unsubscribe();
  }

  calculateScaleFactors(): void {
    const marginWidth = 160;
    const marginHeight = 60;
    this.availableWidth = window.innerWidth - marginWidth;
    this.availableHeight = window.innerHeight - marginHeight;

    // Set baseWidth dynamically:
    // If window.innerWidth is less than 2100, use 1920; otherwise, use 2560.
    if (window.innerWidth < 2100) {
      this.baseWidth = 1920;
    } else {
      this.baseWidth = 2560;
    }

    const naturalScaleX = Math.min(this.availableWidth / this.baseWidth, 1);
    const naturalScaleY = Math.min(this.availableHeight / this.baseHeight, 1);

    this.scrollingEnabledX = false;
    this.scrollingEnabledY = false;

    if (naturalScaleX >= this.scrollThreshold) {
      this.scaleX = naturalScaleX;
      this.effectiveWidth = this.baseWidth;
    } else {
      this.scaleX = this.scrollThreshold;
      this.effectiveWidth = this.baseWidth;
      this.scrollingEnabledX = true;
    }

    if (naturalScaleY >= this.scrollThreshold) {
      this.scaleY = naturalScaleY;
      this.effectiveHeight = this.baseHeight;
    } else {
      this.scaleY = this.scrollThreshold;
      this.effectiveHeight = this.baseHeight;
      this.scrollingEnabledY = true;
    }
  }
}
