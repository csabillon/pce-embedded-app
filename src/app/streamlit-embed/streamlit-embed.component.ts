import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule }                                         from '@angular/common';
import { ActivatedRoute, Data, Params, Router }                from '@angular/router';
import { Subscription }                                         from 'rxjs';
import { NavigationService }                                    from '../navigation.service';
import { ThemeService }                                         from '../theme.service';

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
  private pageLabel    = '';
  private currentRig   = 'TODTH';
  private currentTheme = 'light';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private nav: NavigationService,
    private theme: ThemeService
  ) {}

  ngOnInit(): void {
    // 1) Get page label once
    this.subs.add(
      this.route.data.subscribe((data: Data) => {
        this.pageLabel = data['page'];
      })
    );

    // 2) React to route queryParams -> reload iframe
    this.subs.add(
      this.route.queryParams.subscribe((params: Params) => {
        this.currentRig   = params['rig']   || this.currentRig;
        this.currentTheme = params['theme'] || this.currentTheme;
        this.setSrc();
      })
    );

    // 3) When user selects a new rig in the sidebar, update URL
    this.subs.add(
      this.nav.rig$.subscribe(rig => {
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { rig, theme: this.currentTheme },
          queryParamsHandling: 'merge'
        });
      })
    );

    // 4) When user toggles theme in Angular, update URL
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
    const ts          = Date.now();
    const pageEncoded = encodeURIComponent(this.pageLabel);
    const url = `http://localhost:8501/`
              + `?rig=${this.currentRig}`
              + `&page=${pageEncoded}`
              + `&theme=${this.currentTheme}`
              + `&_ts=${ts}`;

    this.iframe.nativeElement.src = url;
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
