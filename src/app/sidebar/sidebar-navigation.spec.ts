import { ANALYTICS_LINKS } from './sidebar.component';

describe('Analytics sidebar navigation', () => {
  it('places Insights immediately before Trends and targets the Insights Streamlit route', () => {
    const insightsIndex = ANALYTICS_LINKS.findIndex(link => link.label === 'Insights');
    const trendsIndex = ANALYTICS_LINKS.findIndex(link => link.route[0] === '/app/analytics/trends');

    expect(insightsIndex).toBeGreaterThanOrEqual(0);
    expect(ANALYTICS_LINKS[insightsIndex].route).toEqual(['/app/analytics/insights']);
    expect(ANALYTICS_LINKS[insightsIndex].icon).toBe('lightbulb');
    expect(trendsIndex).toBe(insightsIndex + 1);
    expect(ANALYTICS_LINKS[trendsIndex].label).toBe('Trends');
  });
});
