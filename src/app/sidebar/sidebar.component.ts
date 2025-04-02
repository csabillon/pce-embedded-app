import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ThemeService } from '../theme.service';
import { NavigationService } from '../navigation.service';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faBars, faOilWell, faChartLine, faGauge, faWater } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, FontAwesomeModule, CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit, OnDestroy {
  logoUrl: string = 'assets/logo.png';
  currentRig: string = 'TODPS'; // default rig key
  isRigPopupOpen: boolean = false;
  private popupTimer: any = null;

  private themeSubscription!: Subscription;
  private rigSubscription!: Subscription;

  constructor(
    private themeService: ThemeService,
    private navigationService: NavigationService,
    private router: Router,
    library: FaIconLibrary
  ) {
    // Use faBars for the hamburger icon and others for menu items.
    library.addIcons(faBars, faOilWell, faChartLine, faGauge, faWater);
  }

  ngOnInit(): void {
    this.themeSubscription = this.themeService.theme$.subscribe(theme => {
      this.logoUrl = theme === 'dark' ? 'assets/logo_white.png' : 'assets/logo.png';
    });
    this.rigSubscription = this.navigationService.rig$.subscribe(rig => {
      this.currentRig = rig;
    });
  }

  toggleRigPopup(): void {
    this.isRigPopupOpen = !this.isRigPopupOpen;
    if (this.isRigPopupOpen) {
      this.startPopupTimer();
    } else {
      this.clearPopupTimer();
    }
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

  selectRig(rig: string): void {
    this.clearPopupTimer();
    this.navigationService.selectRig(rig);
    this.isRigPopupOpen = false; // Close popup after selection

    // Check current route:
    if (this.router.url === '/app/startup') {
      // If currently on the startup page, navigate to the BOP Stack page.
      this.router.navigate(['/app/bopstack']);
    }
    // Otherwise, remain on the current page.
  }

  ngOnDestroy(): void {
    this.themeSubscription?.unsubscribe();
    this.rigSubscription?.unsubscribe();
    this.clearPopupTimer();
  }
}
