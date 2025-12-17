import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule }   from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { Subscription }   from 'rxjs';
import { filter } from 'rxjs/operators';
import { FormsModule }    from '@angular/forms';
import { ThemeService }   from '../theme.service';
import { NavigationService }    from '../navigation.service';
import { RigLocationService, Rig } from '../rig-location.service';

import { FaIconLibrary, FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faBars,
  faOilWell,
  faChartLine,
  faGauge,
  faWater,
  faChevronDown,
  faChevronRight,
  faIndustry,
  faCog
} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, FontAwesomeModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit, OnDestroy {
  currentRig   = 'TODPS';
  currentTheme = 'light';

  realTimeOpen  = true;
  analyticsOpen = true;
  adminOpen     = true; // new dropdown default state

  isRigPopupOpen = false;
  rigs: Rig[]    = [];
  private popupTimer: any = null;

  private themeSub!: Subscription;
  private rigSub!: Subscription;
  private routerSub!: Subscription;

  currentRoute = '';

  // Removed "Settings" from Analytics; it now lives under Admin
  analyticsLinks = [
    { label: 'Valve Cycles',    route: ['/app/analytics/valve-analytics'] },
    { label: 'Pod Health',      route: ['/app/analytics/pods-overview'] },
    { label: 'EDS Events',      route: ['/app/analytics/eds-cycles'] },
    { label: 'Pressure Cycles', route: ['/app/analytics/pressure-cycles'] },
    { label: 'Custom Trends',   route: ['/app/analytics/trends'] }
  ];

  constructor(
    private router: Router,
    private themeService: ThemeService,
    private navigationService: NavigationService,
    private rigService: RigLocationService,
    library: FaIconLibrary
  ) {
    library.addIcons(
      faBars, faOilWell, faChartLine, faGauge, faWater,
      faChevronDown, faChevronRight, faIndustry, faCog
    );
  }

  ngOnInit(): void {
    this.themeSub = this.themeService.theme$
      .subscribe(t => this.currentTheme = t);

    this.rigSub = this.navigationService.rig$
      .subscribe(r => this.currentRig = r);

    this.rigService.getRigs().subscribe(data => this.rigs = data);

    // Track current route
    this.currentRoute = this.router.url;
    this.routerSub = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.currentRoute = event.url;
    });
  }

  toggleGroup(group: 'realTime' | 'analytics' | 'admin') {
    if (group === 'realTime')      this.realTimeOpen  = !this.realTimeOpen;
    else if (group === 'analytics') this.analyticsOpen = !this.analyticsOpen;
    else                            this.adminOpen     = !this.adminOpen;
  }

  toggleRigPopup() {
    this.isRigPopupOpen = !this.isRigPopupOpen;
    this.isRigPopupOpen ? this.startPopupTimer() : this.clearPopupTimer();
  }
  private startPopupTimer() {
    this.clearPopupTimer();
    this.popupTimer = setTimeout(() => this.isRigPopupOpen = false, 10_000);
  }
  private clearPopupTimer() {
    if (this.popupTimer) { clearTimeout(this.popupTimer); this.popupTimer = null; }
  }
  onRigClick(rigId: string, e: Event) {
    e.stopPropagation();
    this.navigationService.selectRig(rigId);
    this.isRigPopupOpen = false;
    if (this.router.url === '/app/startup') {
      this.router.navigate(['/app/bopstack']);
    }
  }

  getRigName(id: string): string {
    const rig = this.rigs.find(r => r.id === id);
    return rig?.name || id;
  }

  isActiveRoute(route: string): boolean {
    return this.currentRoute.includes(route);
  }

  ngOnDestroy(): void {
    this.themeSub.unsubscribe();
    this.rigSub.unsubscribe();
    this.routerSub.unsubscribe();
    this.clearPopupTimer();
  }
}
