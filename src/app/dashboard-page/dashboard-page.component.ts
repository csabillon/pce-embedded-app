// dashboard-page.component.ts
import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { ThemeService } from '../theme.service';
import { ActivatedRoute, Router, Params } from '@angular/router';
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
  baseWidth = 2560;
  baseHeight = 1340;

  availableWidth = 0;
  availableHeight = 0;

  scaleX = 1;
  scaleY = 1;

  effectiveWidth = 0;
  effectiveHeight = 0;

  @Input() scrollThreshold = 0.9;
  scrollingEnabledX = false;
  scrollingEnabledY = false;

  private themeSub?: Subscription;
  private rigSub?: Subscription;

  /** Toggle: false = keep Angular URL clean; true = show rig/theme (shareable). */
  private SHOW_FULL_ADDRESS = false;

  /** Your Grafana URL template (includes kiosk). {rig} will be replaced. */
  private baseGrafanaUrlTemplate =
    'http://grafana/d/{rig}_BOP/pce-bop-stack-uid?orgId=1&from=now-7d&to=now&timezone=browser&refresh=5s&kiosk&panelId=1';

  /** You can override via @Input or route data. */
  @Input() baseGrafanaUrl = this.baseGrafanaUrlTemplate;

  // Current state
  private currentRig = 'TODTH';
  private currentTheme = 'light';

  private onResize = () => this.calculateScaleFactors();

  constructor(
    private sanitizer: DomSanitizer,
    private themeService: ThemeService,
    private route: ActivatedRoute,
    private router: Router,
    private navigationService: NavigationService
  ) {}

  ngOnInit(): void {
    // Allow route data to override the template (optional)
    const routeUrl = this.route.snapshot.data['baseGrafanaUrl'];
    if (routeUrl) {
      this.baseGrafanaUrlTemplate = routeUrl;
      this.baseGrafanaUrl = routeUrl;
    }

    // Seed from query params (first load)
    const qp = this.route.snapshot.queryParams ?? {};
    if (typeof qp['rig'] === 'string' && qp['rig'])   this.currentRig = qp['rig'];
    if (typeof qp['theme'] === 'string' && qp['theme']) this.currentTheme = qp['theme'];

    this.rebuildGrafanaUrl();
    this.applyAddressPolicy();

    // React to rig changes
    this.rigSub = this.navigationService.rig$.subscribe(rig => {
      if (!rig || rig === this.currentRig) return;
      this.currentRig = rig;
      this.rebuildGrafanaUrl();
      this.applyAddressPolicy();
    });

    // React to theme changes
    this.themeSub = this.themeService.theme$.subscribe(theme => {
      if (!theme || theme === this.currentTheme) return;
      this.currentTheme = theme;
      this.rebuildGrafanaUrl();
      this.applyAddressPolicy();
    });

    // Sizing
    this.calculateScaleFactors();
    window.addEventListener('resize', this.onResize);
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.onResize);
    this.themeSub?.unsubscribe();
    this.rigSub?.unsubscribe();
  }

  // -------- Build & sanitize the Grafana URL (preserves kiosk) --------
  private rebuildGrafanaUrl(): void {
    // Always start from the template so flags like `kiosk` don’t get lost over time
    const template = this.baseGrafanaUrl || this.baseGrafanaUrlTemplate;
    const withRig = template.replace('{rig}', encodeURIComponent(this.currentRig));

    let finalUrl = withRig;
    try {
      const u = new URL(withRig);
      // Force theme (overrides any existing theme param)
      u.searchParams.set('theme', this.currentTheme);

      // Ensure kiosk stays active. Grafana accepts kiosk=1 and kiosk (bare).
      // We normalize to kiosk=1 so it never gets dropped by serialization.
      if (!u.searchParams.has('kiosk')) {
        u.searchParams.set('kiosk', '1');
      } else {
        const v = u.searchParams.get('kiosk');
        if (v === '' || v === null) u.searchParams.set('kiosk', '1');
      }

      finalUrl = u.toString();
    } catch {
      // Fallback: append/replace theme and ensure kiosk=1 manually
      const hasTheme = /([?&])theme=/.test(withRig);
      const hasKiosk = /([?&])kiosk([=&]|$)/.test(withRig);

      const joiner = withRig.includes('?') ? '&' : '?';
      let url = withRig;

      if (!hasTheme) url += `${joiner}theme=${encodeURIComponent(this.currentTheme)}`;
      else           url = url.replace(/([?&])theme=[^&]*/,'$1theme=' + encodeURIComponent(this.currentTheme));

      if (!hasKiosk) url += (url.includes('?') ? '&' : '?') + 'kiosk=1';
      else           url = url.replace(/([?&])kiosk(?:=[^&]*)?/,'$1kiosk=1');

      finalUrl = url;
    }

    this.grafanaSafeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(finalUrl);
  }

  // -------- Address bar policy (strip or show rig/theme) --------
  private applyAddressPolicy(): void {
    const qp = this.route.snapshot.queryParams as Params;

    if (this.SHOW_FULL_ADDRESS) {
      if (qp['rig'] !== this.currentRig || qp['theme'] !== this.currentTheme) {
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { rig: this.currentRig, theme: this.currentTheme },
          queryParamsHandling: 'merge',
          replaceUrl: true
        });
      }
      return;
    }

    if (qp['rig'] || qp['theme']) {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { rig: null, theme: null },
        queryParamsHandling: 'merge',
        replaceUrl: true
      });
    }
  }

  // -------- Sizing / scaling --------
  private calculateScaleFactors(): void {
    const marginWidth = 160;
    const marginHeight = 60;
    this.availableWidth = window.innerWidth - marginWidth;
    this.availableHeight = window.innerHeight - marginHeight;

    this.baseWidth = window.innerWidth < 2100 ? 1900 : 2500;

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
