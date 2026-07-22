import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { FooterComponent } from '../footer/footer.component';
import { CommonModule, NgClass } from '@angular/common';
import { ThemeService } from '../theme.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, NgClass, HeaderComponent, SidebarComponent, FooterComponent, RouterOutlet],
  templateUrl: './main-layout.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./main-layout.component.css']
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  theme: string = 'light';
  sidebarCollapsed = false;
  readonly sidebarExpandedWidth = 184;
  readonly sidebarCollapsedWidth = 56;
  private themeSub!: Subscription;

  constructor(private themeService: ThemeService) {}

  ngOnInit(): void {
    this.themeSub = this.themeService.theme$.subscribe(t => {
      this.theme = t;
    });
  }

  ngOnDestroy(): void {
    if (this.themeSub) {
      this.themeSub.unsubscribe();
    }
  }

  onSidebarCollapsed(next: boolean): void {
    this.sidebarCollapsed = next;
    window.dispatchEvent(new Event('resize'));
  }
}
