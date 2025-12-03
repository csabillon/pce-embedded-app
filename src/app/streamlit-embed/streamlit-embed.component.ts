// steamlit-embed.component.ts
import {
  Component, OnInit, OnDestroy, ViewChild, ElementRef, Optional
} from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Data, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { NavigationService } from '../navigation.service';
import { ThemeService } from '../theme.service';

type DatePair = { start: string; end: string };
type State = {
  page: string; rig: string; theme: string;
  preset: string | null; start: string; end: string;
  uid: string | null;
};

type ShareQuery = {
  rig?: string | null;
  theme?: string | null;
  start?: string | null;
  end?: string | null;
  preset?: string | null;
  uid?: string | null;
};

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

  // Toggle address bar contents. False = hide rig/theme/start/end/preset/uid.
  private SHOW_FULL_ADDRESS = true;

  // Manually set this for testing. Set to null to disable uid entirely.
  // UID identifies a user namespace in the Streamlit Trends page (isolates session state & saved presets).
  // Allowed characters: letters (A–Z, a–z), digits (0–9), '.', '-', and '_'. Others are replaced with '_'.
  // Examples of valid values: 'user_01', 'chris_test', 'alice-light', 'dev.alpha', 'qa_user', 'demo-01', 'test_user_2', 'bob.dev'
  private USER_ID: string | null = 'chris-test';

  private streamlitBase = 'http://localhost:8501/';

  // Single source of truth
  private s: State = {
    page: 'Valve Analytics',
    rig: 'TODTH',
    theme: 'light',
    preset: 'last_30_days',
    start: '',
    end: '',
    uid: null
  };
  private lastNonTrendsPreset: string | null = 'last_30_days';
  private lastIframeUrl = '';
  private didCleanOnce = false;

  // sessionStorage keys
  private kRig = 'bopRig';
  private kTheme = 'bopTheme';
  private kDate = (rig: string) => `bopDate:${rig}`;
  private kPreset = (rig: string) => `bopPreset:${rig}`;
  private kUid = 'bopUid';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    @Optional() private nav?: NavigationService,
    @Optional() private themeSvc?: ThemeService,
  ) {}

  // ---------------- lifecycle ----------------
  ngOnInit(): void {
    // page from route.data, rig/theme from storage (embedded flow)
    const data: Data = this.route.snapshot.data ?? {};
    this.s.page  = (data['page'] as string) || this.s.page;
    this.s.rig   = this.readStr(this.kRig)   ?? this.s.rig;
    this.s.theme = this.readStr(this.kTheme) ?? this.s.theme;

    // uid: prefer explicit USER_ID (for testing), fallback to stored uid
    const storedUid = this.readStr(this.kUid);
    this.s.uid = (this.USER_ID !== null && String(this.USER_ID).trim() !== '')
      ? String(this.USER_ID).trim()
      : (storedUid && storedUid.trim() ? storedUid.trim() : null);

    // restore preset/dates from storage (embed ignores incoming query params)
    const storedPreset = this.readStr(this.kPreset(this.s.rig));
    if (this.s.page !== 'Trends') {
      this.restoreForRig(storedPreset);
    } else {
      if (storedPreset && storedPreset !== 'range') {
        this.s.preset = storedPreset; this.lastNonTrendsPreset = storedPreset;
      }
      this.s.start = ''; this.s.end = '';
    }
    this.persist();

    // 1) set iframe once with full params (fast & stable)
    this.setIframeSrc();

    // 2) clean/hide Angular address bar (no navigation — just replaceState)
    if (!this.SHOW_FULL_ADDRESS) this.clearQueryStringOnce();
    else this.setAddressBarFull();

    // Optional external rig changes (Angular -> Streamlit)
    if (this.nav?.rig$) {
      this.subs.add(
        this.nav.rig$.subscribe(newRig => {
          if (!newRig || newRig === this.s.rig) return;
          this.s.rig = newRig;
          if (this.s.page !== 'Trends') this.restoreForRig(this.readStr(this.kPreset(this.s.rig)));
          else { this.s.start = ''; this.s.end = ''; }
          this.persist();
          this.setIframeSrc();
          if (this.SHOW_FULL_ADDRESS) this.setAddressBarFull();
        })
      );
    }

    // External theme changes (Angular -> Streamlit)
    if (this.themeSvc?.theme$) {
      this.subs.add(
        this.themeSvc.theme$.subscribe(th => {
          if (!th || th === this.s.theme) return;
          this.s.theme = th;
          this.persist();
          this.setIframeSrc();
          if (this.SHOW_FULL_ADDRESS) this.setAddressBarFull();
        })
      );
    }

    // Streamlit -> Angular (dates only)
    window.addEventListener('message', this.onMsg);
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    window.removeEventListener('message', this.onMsg);
  }

  // ------------- Streamlit -> Angular (dates only) -------------
  private onMsg = (ev: MessageEvent<any>) => {
    if (ev.data?.type !== 'BOP_DATE_CHANGE' || this.s.page === 'Trends') return;
    const start = String(ev.data.start || ''), end = String(ev.data.end || '');
    if (!start || !end) return;

    const isQuick = !!ev.data.isQuickPreset;
    const presetId = this.normalizePreset(ev.data.presetId ?? null);

    if (isQuick && presetId && presetId !== 'range') {
      this.s.preset = presetId; this.lastNonTrendsPreset = presetId;
      this.s.start = ''; this.s.end = '';
      this.persistDates(this.s.rig, { start, end });
    } else {
      this.s.preset = 'range'; this.s.start = start; this.s.end = end;
      this.persistDates(this.s.rig, { start, end });
    }
    this.writeStr(this.kPreset(this.s.rig), this.normalizePreset(this.s.preset));

    // Rebuild iframe URL only if it actually changes
    this.setIframeSrc();
    if (this.SHOW_FULL_ADDRESS) this.setAddressBarFull();
  };

  // ---------------- iframe URL (always full) ----------------
  private setIframeSrc(): void {
    const usp = new URLSearchParams();
    usp.set('page',  this.s.page  || 'Valve Analytics');
    usp.set('rig',   this.s.rig   || 'TODTH');
    usp.set('theme', this.s.theme || 'light'); // always include — stable & immediate
    if (this.s.uid && this.s.uid.trim()) {
      usp.set('uid', this.s.uid.trim());       // <-- add uid to Streamlit URL
    }

    if (this.s.page !== 'Trends') {
      const p = this.normalizePreset(this.s.preset);
      if (p && p !== 'range') {
        usp.set('preset', p);
      } else if (this.s.start && this.s.end) {
        usp.set('start', this.s.start);
        usp.set('end',   this.s.end);
      }
    }

    const nextUrl = `${this.streamlitBase}?${usp.toString()}`;
    if (nextUrl !== this.lastIframeUrl) {
      this.iframe.nativeElement.src = nextUrl;
      this.lastIframeUrl = nextUrl;
    }
  }

  // ---------------- address bar helpers (no router nav) ----------------
  private clearQueryStringOnce(): void {
    if (this.didCleanOnce) return;
    this.didCleanOnce = true;
    const path = this.router.url.split('?')[0]; // keep route/path, drop everything after '?'
    this.location.replaceState(path);
  }

  private setAddressBarFull(): void {
    const qp = this.buildShareQueryParams();
    // Build URL tree for current route with our query params, then replaceState (no navigation)
    const tree = this.router.createUrlTree([], {
      relativeTo: this.route,
      queryParams: qp,
      queryParamsHandling: '' // overwrite; we control these keys
    });
    const url = this.router.serializeUrl(tree);
    this.location.replaceState(url);
  }

  private buildShareQueryParams(): ShareQuery {
    const q: ShareQuery = { rig: this.s.rig, theme: this.s.theme };
    if (this.s.uid && this.s.uid.trim()) q.uid = this.s.uid.trim(); // <-- include uid in share URL
    if (this.s.page !== 'Trends') {
      const p = this.normalizePreset(this.s.preset);
      if (p && p !== 'range') q.preset = p;
      else if (this.s.start && this.s.end) { q.start = this.s.start; q.end = this.s.end; }
    }
    return q;
  }

  // ---------------- state + storage ----------------
  private restoreForRig(storedPreset: string | null): void {
    if (storedPreset && storedPreset !== 'range') {
      this.s.preset = storedPreset; this.lastNonTrendsPreset = storedPreset;
      this.s.start = ''; this.s.end = ''; return;
    }
    const storedDates = this.readDates(this.s.rig);
    if (storedDates) { this.s.preset = 'range'; this.s.start = storedDates.start; this.s.end = storedDates.end; return; }
    if (this.lastNonTrendsPreset && this.lastNonTrendsPreset !== 'range') {
      this.s.preset = this.lastNonTrendsPreset; this.s.start = ''; this.s.end = '';
    }
  }

  private persist(): void {
    this.writeStr(this.kRig, this.s.rig);
    this.writeStr(this.kTheme, this.s.theme);
    this.writeStr(this.kPreset(this.s.rig), this.normalizePreset(this.s.preset));
    // persist uid so it survives refreshes (manual override still comes from USER_ID)
    this.writeStr(this.kUid, this.s.uid);
    if (this.s.preset === 'range' && this.s.start && this.s.end) {
      this.persistDates(this.s.rig, { start: this.s.start, end: this.s.end });
    }
  }

  private persistDates(rig: string, pair: DatePair): void {
    try { sessionStorage.setItem(this.kDate(rig), JSON.stringify(pair)); } catch {}
  }
  private readDates(rig: string): DatePair | null {
    try { const s = sessionStorage.getItem(this.kDate(rig)); return s ? JSON.parse(s) as DatePair : null; } catch { return null; }
  }
  private readStr(key: string): string | null {
    try { return sessionStorage.getItem(key); } catch { return null; }
  }
  private writeStr(key: string, val: string | null): void {
    try { if (val === null || val === undefined) sessionStorage.removeItem(key); else sessionStorage.setItem(key, val); } catch {}
  }

  // ---------------- misc ----------------
  private normalizePreset(p?: any): string | null {
    if (!p) return null; const s = String(p).trim().toLowerCase(); return s || null;
  }
}
