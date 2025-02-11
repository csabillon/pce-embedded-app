import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { ThemeService } from '../theme.service';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faOilWell, faChartLine, faGauge } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, FontAwesomeModule], // Import FontAwesomeModule here
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit, OnDestroy {
  logoUrl: string = 'assets/logo.png'; // default logo for light theme
  private themeSubscription!: Subscription;

  constructor(private themeService: ThemeService, library: FaIconLibrary) {
    // Add icons to the library for use in the template
    library.addIcons(faOilWell, faChartLine, faGauge);
  }

  ngOnInit(): void {
    this.themeSubscription = this.themeService.theme$.subscribe(theme => {
      // Update the logo based on the theme
      this.logoUrl = theme === 'dark' ? 'assets/logo_white.png' : 'assets/logo.png';
    });
  }

  ngOnDestroy(): void {
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe();
    }
  }
}
