import { Location } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, ParamMap, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

import { StreamlitEmbedComponent } from './streamlit-embed.component';

class ActivatedRouteStub {
  private readonly params = new BehaviorSubject<ParamMap>(convertToParamMap({ analyticsPage: 'valve-analytics' }));
  private readonly query = new BehaviorSubject<ParamMap>(convertToParamMap({}));

  readonly paramMap = this.params.asObservable();
  readonly queryParamMap = this.query.asObservable();
  snapshot = {
    paramMap: this.params.value,
    queryParamMap: this.query.value,
  };

  setAnalyticsPage(slug: string): void {
    const next = convertToParamMap({ analyticsPage: slug });
    this.snapshot = { ...this.snapshot, paramMap: next };
    this.params.next(next);
  }
}

class RouterStub {
  url = '/app/analytics/valve-analytics';

  createUrlTree(): string {
    return this.url;
  }

  serializeUrl(tree: string): string {
    return tree;
  }
}

class LocationStub {
  replaceState(_path: string): void {}
}

describe('StreamlitEmbedComponent', () => {
  let fixture: ComponentFixture<StreamlitEmbedComponent>;
  let component: StreamlitEmbedComponent;
  let route: ActivatedRouteStub;

  beforeEach(async () => {
    route = new ActivatedRouteStub();

    await TestBed.configureTestingModule({
      imports: [StreamlitEmbedComponent],
      providers: [
        { provide: ActivatedRoute, useValue: route },
        { provide: Router, useClass: RouterStub },
        { provide: Location, useClass: LocationStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(StreamlitEmbedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('keeps visited Streamlit page frames cached across analytics route changes', () => {
    expect(component.activeSlug).toBe('valve-analytics');
    expect(component.frames.length).toBe(1);
    const valveFrame = component.frames[0];

    route.setAnalyticsPage('pods-overview');
    fixture.detectChanges();

    expect(component.activeSlug).toBe('pods-overview');
    expect(component.frames.length).toBe(2);
    expect(component.frames.find(frame => frame.slug === 'valve-analytics')?.src).toBe(valveFrame.src);

    route.setAnalyticsPage('valve-analytics');
    fixture.detectChanges();

    expect(component.activeSlug).toBe('valve-analytics');
    expect(component.frames.length).toBe(2);
    expect(component.frames.find(frame => frame.slug === 'valve-analytics')?.src).toBe(valveFrame.src);
  });

  it('recreates expired cached Streamlit frames instead of reusing stale sessions', () => {
    const valveFrame = component.frames[0];

    route.setAnalyticsPage('pods-overview');
    fixture.detectChanges();

    valveFrame.lastUsedAt = Date.now() - (3 * 60 * 1000);
    route.setAnalyticsPage('valve-analytics');
    fixture.detectChanges();

    const refreshedValveFrame = component.frames.find(frame => frame.slug === 'valve-analytics');
    expect(refreshedValveFrame).toBeTruthy();
    expect(refreshedValveFrame).not.toBe(valveFrame);
    expect(refreshedValveFrame?.src).toBe(valveFrame.src);
  });

  it('bounds inactive iframe sessions while retaining the active page', () => {
    for (const slug of ['pods-overview', 'eds-cycles', 'pressure-cycles']) {
      route.setAnalyticsPage(slug);
      fixture.detectChanges();
    }

    expect(component.frames.length).toBe(3);
    expect(component.frames.some(frame => frame.slug === 'pressure-cycles')).toBeTrue();
    expect(component.frames.some(frame => frame.slug === 'valve-analytics')).toBeFalse();
  });

  it('ignores date messages that do not come from the active Streamlit iframe', () => {
    const originalUrl = component.frames[0].src;
    window.dispatchEvent(new MessageEvent('message', {
      data: {
        type: 'BOP_DATE_CHANGE',
        start: '2026-01-01T00:00:00Z',
        end: '2026-01-02T00:00:00Z',
        presetId: 'range',
      },
      origin: 'https://untrusted.example',
    }));

    expect(component.frames[0].src).toBe(originalUrl);
  });
});
