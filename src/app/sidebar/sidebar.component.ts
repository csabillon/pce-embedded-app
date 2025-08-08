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
  faChevronRight,
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
  currentRig   = 'TODPS';
  currentTheme = 'light';

  realTimeOpen  = true;
  analyticsOpen = true;

  isRigPopupOpen = false;
  rigs: Rig[]    = [];
  private popupTimer: any = null;

  private themeSub!: Subscription;
  private rigSub!: Subscription;

  analyticsLinks = [
    { label: 'Valve Cycles', route: ['/app/analytics/valve-analytics'] },
    { label: 'Pod Health',   route: ['/app/analytics/pods-overview'] },
    { label: 'EDS Events',   route: ['/app/analytics/eds-cycles'] },
    { label: 'Pressure Cycles',   route: ['/app/analytics/pressure-cycles'] }
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
      faChevronDown, faChevronRight, faIndustry // <--- Register new icon here
    );
  }

  ngOnInit(): void {
    this.themeSub = this.themeService.theme$
      .subscribe(t => this.currentTheme = t);

    this.rigSub = this.navigationService.rig$
      .subscribe(r => this.currentRig = r);

    this.rigService.getRigs().subscribe(data => this.rigs = data);
  }

  toggleGroup(group: 'realTime' | 'analytics') {
    if (group === 'realTime')  this.realTimeOpen  = !this.realTimeOpen;
    else                        this.analyticsOpen = !this.analyticsOpen;
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

  ngOnDestroy(): void {
    this.themeSub.unsubscribe();
    this.rigSub.unsubscribe();
    this.clearPopupTimer();
  }
}
