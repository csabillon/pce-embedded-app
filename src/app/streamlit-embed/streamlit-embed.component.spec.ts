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
});
