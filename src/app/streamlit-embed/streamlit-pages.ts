export type StreamlitPage = {
  readonly slug: string;
  readonly label: string;
  readonly dateless: boolean;
};

export const STREAMLIT_ANALYTICS_PAGES: readonly StreamlitPage[] = [
  { slug: 'valve-analytics', label: 'Valve Analytics', dateless: false },
  { slug: 'pods-overview', label: 'Pods Overview', dateless: false },
  { slug: 'eds-cycles', label: 'EDS Cycles', dateless: false },
  { slug: 'pressure-cycles', label: 'Pressure Cycles', dateless: false },
  { slug: 'modeling', label: 'Modeling', dateless: true },
  { slug: 'trends', label: 'Trends', dateless: true },
  { slug: 'settings', label: 'Settings', dateless: true },
  { slug: 'reports', label: 'Reports', dateless: true },
] as const;

export const DEFAULT_STREAMLIT_PAGE = STREAMLIT_ANALYTICS_PAGES[0];

export function normalizeAnalyticsSlug(slug: string | null | undefined): string {
  const value = String(slug ?? '').trim().toLowerCase();
  return STREAMLIT_ANALYTICS_PAGES.some(page => page.slug === value)
    ? value
    : DEFAULT_STREAMLIT_PAGE.slug;
}

export function streamlitPageFromSlug(slug: string | null | undefined): StreamlitPage {
  const normalized = normalizeAnalyticsSlug(slug);
  return STREAMLIT_ANALYTICS_PAGES.find(page => page.slug === normalized) ?? DEFAULT_STREAMLIT_PAGE;
}

export function isDatelessStreamlitPage(label: string): boolean {
  return STREAMLIT_ANALYTICS_PAGES.some(page => page.label === label && page.dateless);
}
