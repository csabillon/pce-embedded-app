import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ThemeService } from '../theme.service';
import { NavigationService } from '../navigation.service';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faBars, faOilWell, faChartLine, faGauge, faWater } from '@fortawesome/free-solid-svg-icons';
import { RigLocationService, Rig } from '../rig-location.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, FontAwesomeModule, CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit, OnDestroy {
  logoUrl: string = 'assets/logo.png';
  currentRig: string = 'TODPS';
  isRigPopupOpen: boolean = false;
  rigs: Rig[] = [];

  private popupTimer: any = null;
  private themeSubscription!: Subscription;
  private rigSubscription!: Subscription;

  constructor(
    private themeService: ThemeService,
    private navigationService: NavigationService,
    private router: Router,
    private rigService: RigLocationService,
    library: FaIconLibrary
  ) {
    library.addIcons(faBars, faOilWell, faChartLine, faGauge, faWater);
  }

  ngOnInit(): void {
    this.themeSubscription = this.themeService.theme$.subscribe(theme => {
      this.logoUrl = theme === 'dark' ? 'assets/logo_white.png' : 'assets/logo.png';
    });

    this.rigSubscription = this.navigationService.rig$.subscribe(rig => {
      this.currentRig = rig;
    });

    this.rigService.getRigs().subscribe(data => {
      this.rigs = data;
    });
  }

  getCurrentRigName(): string {
    const match = this.rigs.find(r => r.id === this.currentRig);
    return match ? match.name : this.currentRig;
  }

  toggleRigPopup(): void {
    this.isRigPopupOpen = !this.isRigPopupOpen;
    this.isRigPopupOpen ? this.startPopupTimer() : this.clearPopupTimer();
  }

  private startPopupTimer(): void {
    this.clearPopupTimer();
    this.popupTimer = setTimeout(() => {
      this.isRigPopupOpen = false;
    }, 10000); // 10 seconds
  }

  private clearPopupTimer(): void {
    if (this.popupTimer) {
      clearTimeout(this.popupTimer);
      this.popupTimer = null;
    }
  }

  onRigClick(rigId: string, event: Event): void {
    event.stopPropagation();
    this.selectRig(rigId);
  }

  selectRig(rigId: string): void {
    this.clearPopupTimer();
    this.navigationService.selectRig(rigId);
    this.isRigPopupOpen = false;

    if (this.router.url === '/app/startup') {
      this.router.navigate(['/app/bopstack']);
    }
  }

  ngOnDestroy(): void {
    this.themeSubscription?.unsubscribe();
    this.rigSubscription?.unsubscribe();
    this.clearPopupTimer();
  }
}
