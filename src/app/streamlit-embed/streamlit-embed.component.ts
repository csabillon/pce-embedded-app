// streamlit-embed.component.ts
import {
  Component, OnInit, OnDestroy, ViewChild, ElementRef, Optional
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Data, Params, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { NavigationService } from '../navigation.service';
import { ThemeService } from '../theme.service';

type DatePair = { start: string; end: string };

@Component({
  selector: 'app-streamlit-embed',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './streamlit-embed.component.html',
  styleUrls: ['./streamlit-embed.component.css']
})
export class StreamlitEmbedComponent implements OnInit, OnDestroy {
  @ViewChild('streamlitFrame', { static: true }) private iframe!: ElementRef<HTMLIFrameElement>;
  private subs = new Subscription();

  /** false = keep Angular URL clean; true = show rig/theme/start/end (shareable). */
  private SHOW_FULL_ADDRESS = true;

  // Minimal state
  private pageLabel = 'Valve Analytics'; // overridden by route.data.page
  private currentRig = 'TODTH';
  private currentTheme = 'light';
  private currentStart = '';              // YYYY-MM-DD (blank → let Streamlit default)
  private currentEnd = '';

  // Per-embed Streamlit session isolation
  private sessionToken = String(Date.now());
  private lastUrl = '';

  // Your Streamlit host
  private streamlitBase = 'http://localhost:8501/';

  // sessionStorage keys
  private kRig = 'bopRig';
  private kTheme = 'bopTheme';
  private kDate = (rig: string) => `bopDate:${rig}`;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    @Optional() private nav?: NavigationService,   // optional: app-wide rig changes
    @Optional() private themeSvc?: ThemeService,   // optional: app-wide theme changes
  ) {}

  // ---------- lifecycle ----------
  ngOnInit(): void {
    // 1) initial snapshot
    const data: Data = this.route.snapshot.data ?? {};
    const qp: Params = this.route.snapshot.queryParams ?? {};
    this.pageLabel    = (data['page']  as string) || this.pageLabel;
    this.currentRig   = (qp['rig']     as string) ?? this.readStr(this.kRig)   ?? this.currentRig;
    this.currentTheme = (qp['theme']   as string) ?? this.readStr(this.kTheme) ?? this.currentTheme;

    if (this.pageLabel !== 'Trends') {
      const urlDates = this.pickDatesFrom(qp['start'], qp['end']);
      const stored   = this.readDates(this.currentRig);
      if (urlDates) { this.currentStart = urlDates.start; this.currentEnd = urlDates.end; }
      else if (stored) { this.currentStart = stored.start; this.currentEnd = stored.end; }
    } else {
      this.currentStart = ''; this.currentEnd = '';
    }

    this.persistRigTheme();
    this.setSrc();
    this.applyAddressPolicy('init');

    // 2) page changes
    this.subs.add(
      this.route.data.subscribe((d: Data) => {
        const next = (d['page'] as string) || this.pageLabel;
        if (next === this.pageLabel) return;

        this.pageLabel = next;
        if (this.pageLabel === 'Trends') {
          this.currentStart = ''; this.currentEnd = '';
        } else {
          const stored = this.readDates(this.currentRig);
          if (stored) { this.currentStart = stored.start; this.currentEnd = stored.end; }
        }
        this.setSrc();
        this.applyAddressPolicy('page');
      })
    );

    // 3) URL query param changes (rig/theme/dates)
    this.subs.add(
      this.route.queryParams.subscribe((params: Params) => {
        const nextRig   = (params['rig']   as string) || this.currentRig;
        const nextTheme = (params['theme'] as string) || this.currentTheme;
        const urlDates  = this.pickDatesFrom(params['start'], params['end']);

        const rigChanged   = nextRig !== this.currentRig;
        const themeChanged = nextTheme !== this.currentTheme;

        this.currentRig   = nextRig;
        this.currentTheme = nextTheme;

        if (this.pageLabel !== 'Trends') {
          if (rigChanged) {
            const stored = this.readDates(this.currentRig);
            this.currentStart = stored?.start || '';
            this.currentEnd   = stored?.end   || '';
          }
          if (urlDates) {
            this.currentStart = urlDates.start;
            this.currentEnd   = urlDates.end;
          }
        } else {
          this.currentStart = ''; this.currentEnd = '';
        }

        this.persistRigTheme();

        if (rigChanged || themeChanged || urlDates) this.setSrc();
        this.applyAddressPolicy('qp');
      })
    );

    // 4) optional app-wide signals (if you use them)
    if (this.nav?.rig$) {
      this.subs.add(
        this.nav.rig$.subscribe(newRig => {
          if (!newRig || newRig === this.currentRig) return;
          this.currentRig = newRig;
          if (this.pageLabel !== 'Trends') {
            const stored = this.readDates(this.currentRig);
            this.currentStart = stored?.start || '';
            this.currentEnd   = stored?.end   || '';
          } else {
            this.currentStart = ''; this.currentEnd = '';
          }
          this.persistRigTheme();
          this.setSrc();
          this.applyAddressPolicy('nav');
        })
      );
    }

    if (this.themeSvc?.theme$) {
      this.subs.add(
        this.themeSvc.theme$.subscribe(th => {
          if (!th || th === this.currentTheme) return;
          this.currentTheme = th;
          this.persistRigTheme();
          this.setSrc();
          this.applyAddressPolicy('theme');
        })
      );
    }

    // 5) Streamlit → Angular (Apply clicked)
    window.addEventListener('message', this.onMsg);
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    window.removeEventListener('message', this.onMsg);
  }

  // ---------- Streamlit → Angular ----------
  private onMsg = (ev: MessageEvent<any>) => {
    if (ev.data?.type !== 'BOP_DATE_CHANGE' || this.pageLabel === 'Trends') return;

    const start = String(ev.data.start || '');
    const end   = String(ev.data.end   || '');
    if (!start || !end) return;

    this.currentStart = start;
    this.currentEnd   = end;
    this.persistDates(this.currentRig, { start, end });

    this.setSrc();
    this.applyAddressPolicy('apply');
  };

  // ---------- iframe URL ----------
  private setSrc(): void {
    const usp = new URLSearchParams();
    usp.set('page',  this.pageLabel || 'Valve Analytics');
    usp.set('rig',   this.currentRig || 'TODTH');
    usp.set('theme', this.currentTheme || 'light');
    if (this.pageLabel !== 'Trends' && this.currentStart && this.currentEnd) {
      usp.set('start', this.currentStart);
      usp.set('end',   this.currentEnd);
    }
    usp.set('s', this.sessionToken); // isolate per-embed session

    const nextUrl = `${this.streamlitBase}?${usp.toString()}`;
    if (nextUrl !== this.lastUrl) {
      this.iframe.nativeElement.src = nextUrl;
      this.lastUrl = nextUrl;
    }
  }

  // ---------- address bar policy (single place) ----------
  private applyAddressPolicy(context: 'init'|'page'|'qp'|'nav'|'theme'|'apply'): void {
    if (this.SHOW_FULL_ADDRESS) {
      const qp: any = { rig: this.currentRig, theme: this.currentTheme };
      if (this.pageLabel !== 'Trends' && this.currentStart && this.currentEnd) {
        qp.start = this.currentStart; qp.end = this.currentEnd;
      } else {
        qp.start = null; qp.end = null; // keep Trends clean even when sharing
      }
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: qp,
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
      return;
    }

    // Clean URL: strip everything we might have used
    const qp: any = { rig: null, theme: null };
    if (this.pageLabel !== 'Trends') { qp.start = null; qp.end = null; }
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: qp,
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  // ---------- sessionStorage ----------
  private persistRigTheme(): void {
    this.writeStr(this.kRig, this.currentRig);
    this.writeStr(this.kTheme, this.currentTheme);
  }
  private readStr(key: string): string | null {
    try { return sessionStorage.getItem(key); } catch { return null; }
  }
  private writeStr(key: string, val: string): void {
    try { sessionStorage.setItem(key, val); } catch {}
  }
  private persistDates(rig: string, pair: DatePair): void {
    try { sessionStorage.setItem(this.kDate(rig), JSON.stringify(pair)); } catch {}
  }
  private readDates(rig: string): DatePair | null {
    try {
      const s = sessionStorage.getItem(this.kDate(rig));
      return s ? (JSON.parse(s) as DatePair) : null;
    } catch { return null; }
  }

  // ---------- misc ----------
  private pickDatesFrom(start?: any, end?: any): DatePair | null {
    if (!start || !end) return null;
    const s = String(start), e = String(end);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || !/^\d{4}-\d{2}-\d{2}$/.test(e)) return null;
    return { start: s, end: e };
  }
}
