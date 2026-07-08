import {
  DEFAULT_STREAMLIT_PAGE,
  isDatelessStreamlitPage,
  normalizeAnalyticsSlug,
  streamlitPageFromSlug,
} from './streamlit-pages';

describe('Streamlit analytics page mapping', () => {
  it('maps known route slugs to Streamlit page labels', () => {
    expect(streamlitPageFromSlug('valve-analytics').label).toBe('Valve Analytics');
    expect(streamlitPageFromSlug('pods-overview').label).toBe('Pods Overview');
    expect(streamlitPageFromSlug('trends').label).toBe('Trends');
  });

  it('falls back to the default page for unknown slugs', () => {
    expect(normalizeAnalyticsSlug('unknown-page')).toBe(DEFAULT_STREAMLIT_PAGE.slug);
    expect(streamlitPageFromSlug(null)).toBe(DEFAULT_STREAMLIT_PAGE);
  });

  it('marks pages without global date routing as dateless', () => {
    expect(isDatelessStreamlitPage('Trends')).toBeTrue();
    expect(isDatelessStreamlitPage('Reports')).toBeTrue();
    expect(isDatelessStreamlitPage('Modeling')).toBeTrue();
    expect(isDatelessStreamlitPage('Valve Analytics')).toBeFalse();
  });
});
