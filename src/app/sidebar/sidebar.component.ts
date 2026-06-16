import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
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
  faBoreHole,
  faHeartbeat,
  faBell,
  faWaveSquare,
  faChartArea,
  faDiagramProject,
  faSliders,
  faFileInvoice,
  faChevronDown,
  faChevronRight,
  faChevronLeft,
  faIndustry
} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, FontAwesomeModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit, OnDestroy {
  @Input() collapsed = false;
  @Output() collapsedChange = new EventEmitter<boolean>();
  @Input() theme: string = 'light';

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

  // "Modeling" and "Settings" now live under Admin
  analyticsLinks = [
    { label: 'Valve Cycles',    route: ['/app/analytics/valve-analytics'], icon: 'bore-hole' },
    { label: 'Pod Health',      route: ['/app/analytics/pods-overview'],   icon: 'heartbeat' },
    { label: 'EDS Events',      route: ['/app/analytics/eds-cycles'],      icon: 'bell' },
    { label: 'Pressure Cycles', route: ['/app/analytics/pressure-cycles'],  icon: 'wave-square' },
    { label: 'Custom Trends',   route: ['/app/analytics/trends'],          icon: 'chart-area' }
  ];

  adminLinks = [
    { label: 'Modeling',  route: ['/app/analytics/modeling'], icon: 'diagram-project' },
    { label: 'Reports',   route: ['/app/analytics/reports'], icon: 'file-invoice' },
    { label: 'Settings',  route: ['/app/analytics/settings'], icon: 'sliders' }
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
      faBoreHole, faHeartbeat, faBell, faWaveSquare, faChartArea,
      faDiagramProject, faSliders, faFileInvoice,
      faChevronLeft,
      faChevronDown, faChevronRight, faIndustry
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

  toggleSidebar(): void {
    this.collapsed = !this.collapsed;
    this.collapsedChange.emit(this.collapsed);
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
