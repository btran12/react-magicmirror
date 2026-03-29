export const FONT_OPTIONS = [
  { value: 'monospace', label: 'Monospace' },
  { value: "'Raleway Dots', cursive", label: 'Raleway Dots' },
];

export const DEFAULT_FONT_FAMILY = 'monospace';

export const WIDGET_OPTIONS = [
  { value: null, label: 'None' },
  { value: 'clock', label: 'Clock' },
  { value: 'weather', label: 'Weather' },
  { value: 'calendar', label: 'Calendar' },
  { value: 'news', label: 'News' },
  { value: 'reddit', label: 'Reddit' },
  { value: 'compliments', label: 'Compliments' },
  { value: 'stocks', label: 'Stocks' },
  { value: 'crypto', label: 'Crypto' },
  { value: 'airquality', label: 'Air Quality' },
  { value: 'sports', label: 'Sports' },
];

export const WIDGET_LABELS = {
  clock: 'Clock',
  weather: 'Weather',
  calendar: 'Calendar',
  news: 'News',
  reddit: 'Reddit',
  compliments: 'Compliments',
  stocks: 'Stocks',
  crypto: 'Crypto',
  airquality: 'Air Quality',
  sports: 'Sports',
};

export const LAYOUT_PRESETS = {
  classic: {
    id: 'classic',
    label: 'Classic',
    description: 'Balanced three-row layout with a full-width footer widget.',
    gridTemplateRows: '2fr 2fr 1fr',
    rows: [
      { id: 'top', label: 'Top Row', colSpans: [3, 6, 3], positions: [0, 1, 2] },
      { id: 'middle', label: 'Middle Row', colSpans: [3, 6, 3], positions: [3, 4, 5] },
      { id: 'bottom', label: 'Bottom Row', colSpans: [12], positions: [6] },
    ],
  },
  spotlight: {
    id: 'spotlight',
    label: 'Spotlight',
    description: 'Highlights one large primary widget with supporting slots.',
    gridTemplateRows: '2fr 1.5fr 1fr',
    rows: [
      { id: 'top', label: 'Top Row', colSpans: [8, 4], positions: [0, 1] },
      { id: 'middle', label: 'Middle Row', colSpans: [4, 4, 4], positions: [2, 3, 4] },
      { id: 'bottom', label: 'Bottom Row', colSpans: [6, 6], positions: [5, 6] },
    ],
  },
  quad: {
    id: 'quad',
    label: 'Quad + Footer',
    description: 'Two-by-two main grid plus a three-widget footer row.',
    gridTemplateRows: '1.8fr 1.8fr 1fr',
    rows: [
      { id: 'top', label: 'Top Row', colSpans: [6, 6], positions: [0, 1] },
      { id: 'middle', label: 'Middle Row', colSpans: [6, 6], positions: [2, 3] },
      { id: 'bottom', label: 'Bottom Row', colSpans: [4, 4, 4], positions: [4, 5, 6] },
    ],
  },
  grid3x3: {
    id: 'grid3x3',
    label: '3 x 3 Grid',
    description: 'Uniform three-row by three-column layout for nine widgets.',
    gridTemplateRows: '1fr 1fr 1fr',
    rows: [
      { id: 'top', label: 'Top Row', colSpans: [4, 4, 4], positions: [0, 1, 2] },
      { id: 'middle', label: 'Middle Row', colSpans: [4, 4, 4], positions: [3, 4, 5] },
      { id: 'bottom', label: 'Bottom Row', colSpans: [4, 4, 4], positions: [6, 7, 8] },
    ],
  },
};

export const DEFAULT_LAYOUT_PRESET = 'classic';

export const POSITION_LABELS = {
  0: 'Top Left',
  1: 'Top Middle',
  2: 'Top Right',
  3: 'Middle Left',
  4: 'Middle Middle',
  5: 'Middle Right',
  6: 'Bottom Left',
  7: 'Bottom Middle',
  8: 'Bottom Right',
};

const PRESET_POSITION_LABELS = {
  classic: {
    0: 'Top Left',
    1: 'Top Middle',
    2: 'Top Right',
    3: 'Middle Left',
    4: 'Middle Middle',
    5: 'Middle Right',
    6: 'Bottom',
  },
  spotlight: {
    0: 'Spotlight',
    1: 'Top Right',
    2: 'Middle Left',
    3: 'Middle Center',
    4: 'Middle Right',
    5: 'Bottom Left',
    6: 'Bottom Right',
  },
  quad: {
    0: 'Top Left',
    1: 'Top Right',
    2: 'Middle Left',
    3: 'Middle Right',
    4: 'Bottom Left',
    5: 'Bottom Middle',
    6: 'Bottom Right',
  },
  grid3x3: {
    0: 'Top Left',
    1: 'Top Middle',
    2: 'Top Right',
    3: 'Middle Left',
    4: 'Middle Middle',
    5: 'Middle Right',
    6: 'Bottom Left',
    7: 'Bottom Middle',
    8: 'Bottom Right',
  },
};

export const DEFAULT_WIDGET_FADE = {
  clock: false,
  weather: true,
  calendar: false,
  news: false,
  reddit: false,
  compliments: false,
  stocks: false,
  crypto: false,
  airquality: false,
  sports: false,
};

export const DEFAULT_LAYOUT = [
  'clock',
  'compliments',
  'weather',
  null,
  null,
  null,
  'news',
  null,
  null,
];

export const LAYOUT_SLOT_COUNT = 9;

export const normalizeLayoutPreset = (presetId) =>
  LAYOUT_PRESETS[presetId] ? presetId : DEFAULT_LAYOUT_PRESET;

export const getLayoutPreset = (presetId) => LAYOUT_PRESETS[normalizeLayoutPreset(presetId)];

export const getPositionLabel = (position, presetId = DEFAULT_LAYOUT_PRESET) => {
  const normalizedPreset = normalizeLayoutPreset(presetId);
  const labels = PRESET_POSITION_LABELS[normalizedPreset] || POSITION_LABELS;
  return labels[position] || `Position ${position + 1}`;
};

export const normalizeLayoutWidgets = (layoutWidgets = []) =>
  Array.from({ length: LAYOUT_SLOT_COUNT }, (_, index) => {
    if (index < layoutWidgets.length) {
      return layoutWidgets[index] ?? null;
    }

    return DEFAULT_LAYOUT[index] ?? null;
  });

export const createWidgetSettingsForType = (widgetType, defaults = {}) => {
  switch (widgetType) {
    case 'clock':
      return {
        widgetType,
        clockFormat: defaults.clockFormat || '24h',
        showFade: defaults.showFade ?? DEFAULT_WIDGET_FADE.clock,
      };
    case 'weather':
      return {
        widgetType,
        openweatherApiKey: defaults.openweatherApiKey || '',
        location: defaults.location || 'New York, New York',
        tempUnit: defaults.tempUnit || 'F',
        clockFormat: defaults.clockFormat || '24h',
        showFade: defaults.showFade ?? DEFAULT_WIDGET_FADE.weather,
      };
    case 'calendar':
      return {
        widgetType,
        icsUrl: defaults.icsUrl || '',
        showFade: defaults.showFade ?? DEFAULT_WIDGET_FADE.calendar,
      };
    case 'news':
      return {
        widgetType,
        newsApiKey: defaults.newsApiKey || '',
        showFade: defaults.showFade ?? DEFAULT_WIDGET_FADE.news,
      };
    case 'reddit':
      return {
        widgetType,
        redditSubreddits: defaults.redditSubreddits || 'news,worldnews,UpliftingNews',
        redditTitlesPerSubreddit: defaults.redditTitlesPerSubreddit || 5,
        redditPollIntervalMinutes: defaults.redditPollIntervalMinutes || 30,
        redditRotationIntervalSeconds: defaults.redditRotationIntervalSeconds || 15,
        showFade: defaults.showFade ?? DEFAULT_WIDGET_FADE.reddit,
      };
    case 'compliments':
      return {
        widgetType,
        complimentsConfigUrl: defaults.complimentsConfigUrl || '',
        openweatherApiKey: defaults.openweatherApiKey || '',
        location: defaults.location || 'New York, New York',
        showFade: defaults.showFade ?? DEFAULT_WIDGET_FADE.compliments,
      };
    case 'stocks':
      return {
        widgetType,
        finnhubApiKey: defaults.finnhubApiKey || '',
        stockTickers: defaults.stockTickers || [],
        showFade: defaults.showFade ?? DEFAULT_WIDGET_FADE.stocks,
      };
    case 'crypto':
      return {
        widgetType,
        cryptoCoins: defaults.cryptoCoins || ['bitcoin', 'ethereum'],
        showFade: defaults.showFade ?? DEFAULT_WIDGET_FADE.crypto,
      };
    case 'airquality':
      return {
        widgetType,
        openweatherApiKey: defaults.openweatherApiKey || '',
        location: defaults.location || 'New York, New York',
        showFade: defaults.showFade ?? DEFAULT_WIDGET_FADE.airquality,
      };
    case 'sports':
      return {
        widgetType,
        sportsLeagues: defaults.sportsLeagues || [],
        sportsTeams: defaults.sportsTeams || '',
        showFade: defaults.showFade ?? DEFAULT_WIDGET_FADE.sports,
      };
    default:
      return {
        widgetType,
        showFade: defaults.showFade ?? false,
      };
  }
};
