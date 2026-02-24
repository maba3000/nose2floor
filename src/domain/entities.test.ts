import { DEFAULT_SETTINGS } from './entities';

test('DEFAULT_SETTINGS enables all insights sections by default', () => {
  expect(DEFAULT_SETTINGS.insightsShowPreview).toBe(true);
  expect(DEFAULT_SETTINGS.insightsShowActivity).toBe(true);
  expect(DEFAULT_SETTINGS.insightsShowStats).toBe(true);
  expect(DEFAULT_SETTINGS.showInputDebug).toBe(false);
});
