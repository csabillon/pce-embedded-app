import {
  Component,
  ElementRef,
  Inject,
  OnDestroy,
  OnInit,
  Optional,
  PLATFORM_ID,
  QueryList,
  ViewChildren,
  ChangeDetectionStrategy
} from '@angular/core';
import { isPlatformBrowser, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MsalService } from '@azure/msal-angular';
import { combineLatest, Subscription } from 'rxjs';
import { environment } from '../../environments/environment';
import { NavigationService } from '../navigation.service';
import { ThemeService } from '../theme.service';
import {
  DEFAULT_STREAMLIT_PAGE,
  isDatelessStreamlitPage,
  STREAMLIT_ANALYTICS_PAGES,
  streamlitPageFromSlug,
} from './streamlit-pages';

type DatePair = { start: string; end: string };
type State = {
  page: string; rig: string; theme: string;
  preset: string | null; start: string; end: string;
  uid: string | null;
  eventid: string | null;
};

type ShareQuery = {
  rig?: string | null;
  theme?: string | null;
  start?: string | null;
  end?: string | null;
  preset?: string | null;
  eventid?: string | null;
};

type StreamlitFrame = {
  slug: string;
  page: string;
  src: string;
  safeSrc: SafeResourceUrl;
  lastUsed: number;
  lastUsedAt: number;
};

const MAX_CACHED_STREAMLIT_FRAMES = 3;
const STREAMLIT_FRAME_TTL_MS = 2 * 60 * 1000;

@Component({
  selector: 'app-streamlit-embed',
  standalone: true,
  imports: [],
  templateUrl: './streamlit-embed.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./streamlit-embed.component.css']
})
export class StreamlitEmbedComponent implements OnInit, OnDestroy {
  @ViewChildren('streamlitFrame') private iframeElements!: QueryList<ElementRef<HTMLIFrameElement>>;

  frames: StreamlitFrame[] = [];
  activeSlug = DEFAULT_STREAMLIT_PAGE.slug;

  private subs = new Subscription();

  // Toggle address bar contents. User identity is never included in the share URL.
  private SHOW_FULL_ADDRESS = true;

  // Optional Trends Cognite preset event id. Set to null to disable.
  // Applies only when the embedded Streamlit page is Trends; other pages do not receive eventid.
  // The Angular route query param eventid is used when this manual override is null.
  // Examples: 'EventExample001' or 'EventExample001.json'.
  private EVENT_ID: string | null ='';

  private readonly isBrowser: boolean;
  private readonly streamlitBaseUrl = new URL(environment.streamlitBaseUrl);

  // Single source of truth
  private s: State = {
    page: 'Valve Analytics',
    rig: 'TODTH',
    theme: 'light',
    preset: 'last_30_days',
    start: '',
    end: '',
    uid: null,
    eventid: null
  };
  private lastNonTrendsPreset: string | null = 'last_30_days';
  private didCleanOnce = false;
  private frameUseSeq = 0;

  // sessionStorage keys
  private kRig = 'bopRig';
  private kTheme = 'bopTheme';
  private kDate = (rig: string) => `bopDate:${rig}`;
  private kPreset = (rig: string) => `bopPreset:${rig}`;
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private sanitizer: DomSanitizer,
    @Inject(PLATFORM_ID) platformId: object,
    @Optional() private msal?: MsalService,
    @Optional() private nav?: NavigationService,
    @Optional() private themeSvc?: ThemeService,
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  // ---------------- lifecycle ----------------
  ngOnInit(): void {
    this.s.rig   = this.readStr(this.kRig)   ?? this.s.rig;
    this.s.theme = this.readStr(this.kTheme) ?? this.s.theme;

    this.s.uid = this.resolveUserId();

    this.subs.add(
      combineLatest([this.route.paramMap, this.route.queryParamMap]).subscribe(() => {
        this.activateCurrentRoute();
      })
    );

    // Optional external rig changes (Angular -> Streamlit)
    if (this.nav?.rig$) {
      this.subs.add(
        this.nav.rig$.subscribe(newRig => {
          if (!newRig || newRig === this.s.rig) return;
          this.s.rig = newRig;
          if (!this.isDatelessPage()) this.restoreForRig(this.readStr(this.kPreset(this.s.rig)));
          else { this.s.start = ''; this.s.end = ''; }
          this.persist();
          this.clearInactiveFrames();
          this.syncActiveFrame();
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
          this.clearInactiveFrames();
          this.syncActiveFrame();
          if (this.SHOW_FULL_ADDRESS) this.setAddressBarFull();
        })
      );
    }

    // Streamlit -> Angular (dates only)
    if (this.isBrowser) window.addEventListener('message', this.onMsg);
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
    if (this.isBrowser) window.removeEventListener('message', this.onMsg);
  }

  // ------------- Streamlit -> Angular (dates only) -------------
  private onMsg = (ev: MessageEvent<any>) => {
    if (!this.isTrustedStreamlitMessage(ev) || ev.data?.type !== 'BOP_DATE_CHANGE' || this.isDatelessPage()) return;
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

    this.syncActiveFrame();
    if (this.SHOW_FULL_ADDRESS) this.setAddressBarFull();
  };

  trackFrame(_index: number, frame: StreamlitFrame): string {
    return frame.slug;
  }

  // ---------------- iframe URL/cache (always full) ----------------
  private activateCurrentRoute(): void {
    const page = streamlitPageFromSlug(this.route.snapshot.paramMap.get('analyticsPage'));
    this.activeSlug = page.slug;
    this.s.page = page.label;

    const queryEventId = this.route.snapshot.queryParamMap.get('eventid');
    this.s.eventid = (this.EVENT_ID !== null && String(this.EVENT_ID).trim() !== '')
      ? String(this.EVENT_ID).trim()
      : (queryEventId && queryEventId.trim() ? queryEventId.trim() : null);

    const storedPreset = this.readStr(this.kPreset(this.s.rig));
    if (!this.isDatelessPage()) {
      this.restoreForRig(storedPreset);
    } else {
      if (storedPreset && storedPreset !== 'range') {
        this.s.preset = storedPreset; this.lastNonTrendsPreset = storedPreset;
      }
      this.s.start = ''; this.s.end = '';
    }
    this.persist();
    this.syncActiveFrame();

    if (!this.SHOW_FULL_ADDRESS) this.clearQueryStringOnce();
    else this.setAddressBarFull();
  }

  private buildStreamlitUrl(): string {
    const usp = new URLSearchParams();
    usp.set('embed', 'true');
    usp.append('embed_options', 'hide_loading_screen');
    usp.set('page',  this.s.page  || 'Valve Analytics');
    usp.set('rig',   this.s.rig   || 'TODTH');
    usp.set('theme', this.s.theme || 'light'); // always include — stable & immediate
    usp.append('embed_options', (this.s.theme || 'light') === 'dark' ? 'dark_theme' : 'light_theme');
    if (this.s.uid && this.s.uid.trim()) {
      usp.set('uid', this.s.uid.trim());       // <-- add uid to Streamlit URL
    }
    if (this.isTrendsPage() && this.s.eventid && this.s.eventid.trim()) {
      usp.set('eventid', this.s.eventid.trim());
    }

    if (!this.isDatelessPage()) {
      const p = this.normalizePreset(this.s.preset);
      if (p && p !== 'range') {
        usp.set('preset', p);
      } else if (this.s.start && this.s.end) {
        usp.set('start', this.s.start);
        usp.set('end',   this.s.end);
      }
    }

    const url = new URL(this.streamlitBaseUrl.href);
    url.search = usp.toString();
    return url.href;
  }

  private syncActiveFrame(): void {
    const nextUrl = this.buildStreamlitUrl();
    const existing = this.frames.find(frame => frame.slug === this.activeSlug);
    const canReuseExisting = !!existing && !this.isFrameExpired(existing);
    if (existing && canReuseExisting) {
      existing.page = this.s.page;
      existing.lastUsed = ++this.frameUseSeq;
      existing.lastUsedAt = Date.now();
      if (existing.src !== nextUrl) {
        existing.src = nextUrl;
        existing.safeSrc = this.sanitizer.bypassSecurityTrustResourceUrl(nextUrl);
      }
    } else {
      const retainedFrames = existing
        ? this.frames.filter(frame => frame.slug !== this.activeSlug)
        : this.frames;
      this.frames = [
        ...retainedFrames,
        {
          slug: this.activeSlug,
          page: this.s.page,
          src: nextUrl,
          safeSrc: this.sanitizer.bypassSecurityTrustResourceUrl(nextUrl),
          lastUsed: ++this.frameUseSeq,
          lastUsedAt: Date.now(),
        },
      ];
    }
    this.pruneCachedFrames();
  }

  private clearInactiveFrames(): void {
    this.frames = this.frames.filter(frame => frame.slug === this.activeSlug);
  }

  private pruneCachedFrames(): void {
    const now = Date.now();
    this.frames = this.frames.filter(frame => frame.slug === this.activeSlug || now - frame.lastUsedAt <= STREAMLIT_FRAME_TTL_MS);
    if (this.frames.length <= MAX_CACHED_STREAMLIT_FRAMES) return;
    const inactive = this.frames
      .filter(frame => frame.slug !== this.activeSlug)
      .sort((a, b) => a.lastUsed - b.lastUsed);
    const remove = new Set(inactive.slice(0, this.frames.length - MAX_CACHED_STREAMLIT_FRAMES).map(frame => frame.slug));
    this.frames = this.frames.filter(frame => !remove.has(frame.slug));
  }

  private isFrameExpired(frame: StreamlitFrame): boolean {
    return Date.now() - frame.lastUsedAt > STREAMLIT_FRAME_TTL_MS;
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
    if (this.isTrendsPage() && this.s.eventid && this.s.eventid.trim()) q.eventid = this.s.eventid.trim();
    if (!this.isDatelessPage()) {
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

  private resolveUserId(): string | null {
    const account = this.msal?.instance.getActiveAccount() ?? this.msal?.instance.getAllAccounts()[0];
    const accountId = account?.localAccountId || account?.homeAccountId;
    const normalized = String(accountId ?? '').trim().replace(/[^A-Za-z0-9._-]/g, '_');
    return normalized || null;
  }

  private isTrustedStreamlitMessage(ev: MessageEvent): boolean {
    if (!this.isBrowser || ev.origin !== this.streamlitBaseUrl.origin) return false;
    const activeIframe = this.iframeElements?.find(
      element => element.nativeElement.dataset['streamlitSlug'] === this.activeSlug,
    );
    return !!activeIframe?.nativeElement.contentWindow && ev.source === activeIframe.nativeElement.contentWindow;
  }

  // Pages that ignore global start/end/preset (operation period comes from widget/session only).
  // Reports uses @st.fragment — rig/theme changes must produce a new iframe.src (URL always includes
  // rig+theme+uid, so any change naturally produces a different URL and triggers a reload).
  private isDatelessPage(): boolean {
    return isDatelessStreamlitPage(this.s.page);
  }

  private isTrendsPage(): boolean {
    return this.s.page === 'Trends';
  }

  private normalizePreset(p?: any): string | null {
    if (!p) return null; const s = String(p).trim().toLowerCase(); return s || null;
  }
}
