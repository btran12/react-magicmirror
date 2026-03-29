import React, { createContext, useState, useCallback } from 'react';

export const WidgetContext = createContext();

const DEFAULT_LAYOUT = [
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

const LEGACY_FADE_SETTINGS = {
  clock: false,
  weather: true,
  calendar: false,
  news: false,
  compliments: false,
  stocks: false,
  crypto: false,
  airquality: false,
  sports: false,
};

const getInitialSettings = () => ({
  openweatherApiKey: localStorage.getItem('openweatherApiKey') || '',
  newsApiKey: localStorage.getItem('newsApiKey') || '',
  finnhubApiKey: localStorage.getItem('finnhubApiKey') || '',
  location: localStorage.getItem('location') || 'New York, New York',
  tempUnit: localStorage.getItem('tempUnit') || 'F',
  clockFormat: localStorage.getItem('clockFormat') || '24h',
  icsUrl: localStorage.getItem('icsUrl') || '',
  complimentsConfigUrl: localStorage.getItem('complimentsConfigUrl') || '',
});

const getInitialFadeSettings = () => {
  try {
    const stored = localStorage.getItem('fadeSettings');
    if (!stored) return LEGACY_FADE_SETTINGS;

    const parsed = JSON.parse(stored);
    return { ...LEGACY_FADE_SETTINGS, ...parsed };
  } catch (e) {
    console.error('Error parsing fadeSettings from localStorage:', e);
    return LEGACY_FADE_SETTINGS;
  }
};

const getInitialLayout = () => {
  try {
    const stored = localStorage.getItem('layout');
    return {
      widgets: stored ? JSON.parse(stored) : DEFAULT_LAYOUT,
    };
  } catch (e) {
    console.error('Error parsing layout from localStorage:', e);
    return {
      widgets: DEFAULT_LAYOUT,
    };
  }
};

const createWidgetSettingsForType = (widgetType, settings, fadeSettings) => {
  switch (widgetType) {
    case 'clock':
      return {
        widgetType,
        clockFormat: settings.clockFormat,
        showFade: fadeSettings.clock,
      };
    case 'weather':
      return {
        widgetType,
        openweatherApiKey: settings.openweatherApiKey,
        location: settings.location,
        tempUnit: settings.tempUnit,
        clockFormat: settings.clockFormat,
        showFade: fadeSettings.weather,
      };
    case 'calendar':
      return {
        widgetType,
        icsUrl: settings.icsUrl,
        showFade: fadeSettings.calendar,
      };
    case 'news':
      return {
        widgetType,
        newsApiKey: settings.newsApiKey,
        showFade: fadeSettings.news,
      };
    case 'compliments':
      return {
        widgetType,
        complimentsConfigUrl: settings.complimentsConfigUrl,
        openweatherApiKey: settings.openweatherApiKey,
        location: settings.location,
        showFade: fadeSettings.compliments,
      };
    case 'stocks':
      return {
        widgetType,
        finnhubApiKey: settings.finnhubApiKey,
        stockTickers: [],
        showFade: fadeSettings.stocks,
      };
    case 'crypto':
      return {
        widgetType,
        cryptoCoins: ['bitcoin', 'ethereum'],
        showFade: fadeSettings.crypto,
      };
    case 'airquality':
      return {
        widgetType,
        openweatherApiKey: settings.openweatherApiKey,
        location: settings.location,
        showFade: fadeSettings.airquality,
      };
    case 'sports':
      return {
        widgetType,
        sportsLeagues: [],
        sportsTeams: '',
        showFade: fadeSettings.sports,
      };
    default:
      return {
        widgetType,
        showFade: false,
      };
  }
};

const buildWidgetSettingsForLayout = (layoutWidgets, storedWidgetSettings, settings, fadeSettings) => {
  const nextWidgetSettings = {};

  layoutWidgets.forEach((widgetType, position) => {
    if (!widgetType) return;

    const defaults = createWidgetSettingsForType(widgetType, settings, fadeSettings);
    const storedSettings = storedWidgetSettings?.[position];

    if (storedSettings?.widgetType === widgetType) {
      nextWidgetSettings[position] = {
        ...defaults,
        ...storedSettings,
        widgetType,
      };
      return;
    }

    nextWidgetSettings[position] = defaults;
  });

  return nextWidgetSettings;
};

const getInitialWidgetSettings = (layoutWidgets, settings, fadeSettings) => {
  try {
    const stored = localStorage.getItem('widgetSettings');
    const parsed = stored ? JSON.parse(stored) : {};
    return buildWidgetSettingsForLayout(layoutWidgets, parsed, settings, fadeSettings);
  } catch (e) {
    console.error('Error parsing widgetSettings from localStorage:', e);
    return buildWidgetSettingsForLayout(layoutWidgets, {}, settings, fadeSettings);
  }
};

export const WidgetProvider = ({ children }) => {
  const [widgets, setWidgets] = useState([
    { id: 1, type: 'clock', title: 'Clock', size: 'medium' },
    { id: 2, type: 'weather', title: 'Weather', size: 'large' },
    { id: 3, type: 'calendar', title: 'Calendar', size: 'medium' },
    { id: 4, type: 'news', title: 'News', size: 'large' },
    { id: 5, type: 'compliments', title: 'Compliments', size: 'medium' },
  ]);

  const [layout, setLayout] = useState(getInitialLayout);

  const [settings, setSettings] = useState(getInitialSettings);
  const [fadeSettings, setFadeSettings] = useState(getInitialFadeSettings);
  const [widgetSettings, setWidgetSettings] = useState(() =>
    getInitialWidgetSettings(layout.widgets, getInitialSettings(), getInitialFadeSettings())
  );

  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, duration);
  }, []);

  const updateSettings = useCallback((newSettings) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      Object.keys(updated).forEach(key => {
        localStorage.setItem(key, updated[key]);
      });
      return updated;
    });
    addNotification('Settings saved', 'success');
  }, [addNotification]);

  const updateLayout = useCallback((newLayout) => {
    setLayout({ widgets: newLayout });
    localStorage.setItem('layout', JSON.stringify(newLayout));
    addNotification('Layout saved', 'success');
  }, [addNotification]);

  const updateWidgetSettings = useCallback((newWidgetSettings, layoutWidgets = layout.widgets, settingsOverride = settings, fadeSettingsOverride = fadeSettings) => {
    const next = buildWidgetSettingsForLayout(layoutWidgets, newWidgetSettings, settingsOverride, fadeSettingsOverride);
    setWidgetSettings(next);
    localStorage.setItem('widgetSettings', JSON.stringify(next));
    addNotification('Widget settings saved', 'success');
  }, [addNotification, fadeSettings, layout.widgets, settings]);

  const saveDashboardConfiguration = useCallback((newLayout, newWidgetSettings, newSettings) => {
    setLayout({ widgets: newLayout });
    localStorage.setItem('layout', JSON.stringify(newLayout));

    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      Object.keys(updated).forEach(key => {
        localStorage.setItem(key, updated[key]);
      });
      return updated;
    });

    const nextWidgetSettings = buildWidgetSettingsForLayout(newLayout, newWidgetSettings, newSettings, fadeSettings);
    setWidgetSettings(nextWidgetSettings);
    localStorage.setItem('widgetSettings', JSON.stringify(nextWidgetSettings));

    addNotification('Settings saved', 'success');
  }, [addNotification, fadeSettings]);

  const updateFadeSettings = useCallback((newFadeSettings) => {
    setFadeSettings(newFadeSettings);
    localStorage.setItem('fadeSettings', JSON.stringify(newFadeSettings));
    addNotification('Fade settings updated', 'success');
  }, [addNotification]);

  const getWidgetSettingsForPosition = useCallback((position, widgetType = layout.widgets[position]) => {
    if (!widgetType) return null;

    const currentSettings = widgetSettings[position];
    if (currentSettings?.widgetType === widgetType) {
      return currentSettings;
    }

    return createWidgetSettingsForType(widgetType, settings, fadeSettings);
  }, [fadeSettings, layout.widgets, settings, widgetSettings]);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const value = {
    widgets,
    setWidgets,
    settings,
    updateSettings,
    layout,
    updateLayout,
    widgetSettings,
    updateWidgetSettings,
    saveDashboardConfiguration,
    getWidgetSettingsForPosition,
    fadeSettings,
    updateFadeSettings,
    notifications,
    addNotification,
    removeNotification,
  };

  return (
    <WidgetContext.Provider value={value}>
      {children}
    </WidgetContext.Provider>
  );
};
