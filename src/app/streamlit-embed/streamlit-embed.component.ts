// streamlit-embed.component.ts (URL-param reload version)

import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Data, Params, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { NavigationService } from '../navigation.service';
import { ThemeService } from '../theme.service';

@Component({
  selector: 'app-streamlit-embed',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './streamlit-embed.component.html',
  styleUrls: ['./streamlit-embed.component.css']
})
export class StreamlitEmbedComponent implements OnInit, OnDestroy {
  @ViewChild('streamlitFrame', { static: true })
  private iframe!: ElementRef<HTMLIFrameElement>;

  private subs = new Subscription();
  private pageLabel    = '';       // from route data
  private currentRig   = 'TODTH';  // kept in query params
  private currentTheme = 'light';  // kept in query params

  // Stable per-component token so each embed instance has its own Streamlit session in case of caching
  private sessionToken = String(Date.now());
  private lastUrl = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private nav: NavigationService,
    private theme: ThemeService
  ) {}

  ngOnInit(): void {
    // Which Streamlit page to open (route-level data)
    this.subs.add(
      this.route.data.subscribe((data: Data) => {
        this.pageLabel = data['page'] || 'Valve Analytics';
        this.setSrc();
      })
    );

    // URL carries rig/theme
    this.subs.add(
      this.route.queryParams.subscribe((params: Params) => {
        this.currentRig   = params['rig']   || this.currentRig;
        this.currentTheme = params['theme'] || this.currentTheme;
        this.setSrc();
      })
    );

    // Local app → keep Angular URL in sync (triggers setSrc via queryParams subscription)
    this.subs.add(
      this.nav.rig$.subscribe(rig => {
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { rig, theme: this.currentTheme },
          queryParamsHandling: 'merge'
        });
      })
    );
    this.subs.add(
      this.theme.theme$.subscribe(th => {
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { rig: this.currentRig, theme: th },
          queryParamsHandling: 'merge'
        });
      })
    );
  }

  private setSrc() {
    const base = `http://localhost:8501/`; // adjust to your server/host
    const usp  = new URLSearchParams();

    // Always include page/rig/theme for deterministic startup
    usp.set('page',  this.pageLabel || 'Valve Analytics');
    usp.set('rig',   this.currentRig || 'TODTH');
    usp.set('theme', this.currentTheme || 'light');

    // Stable per-embed token avoids shared caches across two Angular embeds
    usp.set('s', this.sessionToken);

    const nextUrl = `${base}?${usp.toString()}`;
    if (nextUrl !== this.lastUrl) {
      this.iframe.nativeElement.src = nextUrl;  // this reloads → new Streamlit session
      this.lastUrl = nextUrl;
    }
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
