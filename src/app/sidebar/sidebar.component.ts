import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule }   from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subscription }   from 'rxjs';
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
  faChevronRight
} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, FontAwesomeModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit, OnDestroy {
  // holds the rig key
  currentRig   = 'TODPS';
  currentTheme = 'light';

  // collapse state
  realTimeOpen  = true;
  analyticsOpen = true;

  // rig-selector popup
  isRigPopupOpen = false;
  rigs: Rig[]    = [];
  private popupTimer: any = null;

  // subscriptions
  private themeSub!: Subscription;
  private rigSub!: Subscription;

  // analytics links
  analyticsLinks = [
    { label: 'Valve Analytics', route: ['/app/analytics/valve-analytics'] },
    { label: 'Pods Overview',   route: ['/app/analytics/pods-overview'] }
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
      faChevronDown, faChevronRight
    );
  }

  ngOnInit(): void {
    // subscribe global theme
    this.themeSub = this.themeService.theme$
      .subscribe(t => this.currentTheme = t);

    // subscribe global rig key
    this.rigSub = this.navigationService.rig$
      .subscribe(r => this.currentRig = r);

    // load rigs for popup and name-lookup
    this.rigService.getRigs().subscribe(data => this.rigs = data);
  }

  // toggle expand/collapse
  toggleGroup(group: 'realTime' | 'analytics') {
    if (group === 'realTime')  this.realTimeOpen  = !this.realTimeOpen;
    else                        this.analyticsOpen = !this.analyticsOpen;
  }

  // rig selection popup
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

  // map a rig key to its display name
  getRigName(id: string): string {
    const rig = this.rigs.find(r => r.id === id);
    return rig?.name || id;
  }

  ngOnDestroy(): void {
    this.themeSub.unsubscribe();
    this.rigSub.unsubscribe();
    this.clearPopupTimer();
  }
}
