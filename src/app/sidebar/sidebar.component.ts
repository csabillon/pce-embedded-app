import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';
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

  private themeSubscription!: Subscription;
  private rigSubscription!: Subscription;

  constructor(
    private themeService: ThemeService,
    private navigationService: NavigationService,
    library: FaIconLibrary
  ) {
    // Use faBars for the hamburger icon.
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
  }

  selectRig(rig: string): void {
    this.navigationService.selectRig(rig);
    this.isRigPopupOpen = false; // popup auto-minimizes after selection
  }

  ngOnDestroy(): void {
    this.themeSubscription?.unsubscribe();
    this.rigSubscription?.unsubscribe();
  }
}
