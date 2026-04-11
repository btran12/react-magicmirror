# Backend Service Implementation Guide

This explains the recommended approach for integrating premium backend services into your widgets.

## Architecture

Instead of creating duplicate widget components, we use a **custom hook** (`useBackendService`) that handles all the complexities:
- JWT authentication
- Premium status checking
- API error handling
- Polling and refresh logic

Your existing widget components stay mostly unchanged and can support both modes:
- **Free mode** (direct API calls with user's API key)
- **Premium mode** (backend service with backend-managed key)

## The Custom Hook: `useBackendService`

Location: `src/hooks/useBackendService.js`

Usage:
```javascript
const { data, loading, error, refetch } = useBackendService(
  '/v1/services/weather',
  { location: 'New York', tempUnit: 'F' },
  5 // poll interval in minutes
);
```

Returns:
- `data` - The API response from the backend service
- `loading` - Boolean indicating if fetching
- `error` - Error message (includes 403 for premium-required)
- `refetch` - Function to manually refresh data

Handles:
- ✅ Extracting JWT from AuthContext
- ✅ Building query parameters
- ✅ HTTP 403 (premium required) → user-friendly message
- ✅ HTTP 401 (auth failed) → user-friendly message
- ✅ Automatic polling at specified interval
- ✅ Cleanup on unmount

## Updating Existing Widgets

### Before (Old Pattern - Direct API Only)

```jsx
export const Weather = ({ apiKey, location, tempUnit, pollIntervalMinutes }) => {
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchWeather = async () => {
      const url = `https://api.openweathermap.org/...?appid=${apiKey}...`;
      const res = await fetch(url);
      const data = await res.json();
      setWeather(data);
    };
    fetchWeather();
  }, [apiKey, location]);

  return <Widget loading={loading} error={error}>{/* Render weather */}</Widget>;
};
```

### After (New Pattern - Supports Both Modes)

```jsx
import { useBackendService } from '../../hooks/useBackendService';

export const Weather = ({
  apiKey,
  location,
  tempUnit,
  pollIntervalMinutes,
  usePremium = false, // <-- NEW: toggle between modes
}) => {
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Use backend service for premium users
  const backendService = useBackendService(
    '/v1/services/weather',
    { location, tempUnit },
    pollIntervalMinutes
  );

  useEffect(() => {
    if (usePremium) {
      // Premium mode: use backend
      setWeather(backendService.data);
      setLoading(backendService.loading);
      setError(backendService.error);
      return;
    }

    // Free mode: use direct API
    if (!apiKey || !location) {
      setError('API key or location not configured');
      return;
    }

    const fetchWeather = async () => {
      // ... existing direct API logic ...
    };
    fetchWeather();
  }, [usePremium, backendService.data, backendService.loading, backendService.error, apiKey, location]);

  return <Widget loading={loading} error={error}>{/* Render weather */}</Widget>;
};
```

## Benefits of This Approach

| Aspect | Duplicate Components | Custom Hook |
|--------|----------------------|------------|
| Code duplication | ❌ 6 copy-paste components | ✅ Single hook |
| UI rendering | ✅ Each has own rendering | ✅ Reuses existing UI |
| Maintenance | ❌ Update 6 places | ✅ Update 1 place |
| Toggle free/premium | ❌ Requires swapping components | ✅ Simple `usePremium` prop |
| Bundle size | ❌ Larger | ✅ Smaller |
| Learning curve | ❌ More code to understand | ✅ Single pattern |

## Implementing for All Services

Follow the same pattern for each widget:

### News
```jsx
const newsService = useBackendService(
  '/v1/services/news',
  {},  // No params needed
  180
);
```

### Stocks
```jsx
const stocksService = useBackendService(
  '/v1/services/stocks',
  { ticker: 'AAPL' },
  5
);
```

### Crypto
```jsx
const cryptoService = useBackendService(
  '/v1/services/crypto',
  { ids: 'bitcoin,ethereum' },
  5
);
```

### Holidays
```jsx
const holidaysService = useBackendService(
  '/v1/services/holidays',
  {},
  720
);
```

### Sports
```jsx
const sportsService = useBackendService(
  '/v1/services/sports',
  { sport: 'baseball', league: 'mlb' },
  5
);
```

## Toggling Between Modes

### Option 1: Widget Config
Update `widgetConfig.js` to pass `usePremium` based on user tier:

```javascript
const userIsPremium = entitlements.premium;

const weatherConfig = {
  component: Weather,
  props: {
    location: 'New York',
    tempUnit: 'F',
    usePremium: userIsPremium,  // Toggle based on user
    // Only request apiKey if not using premium
    ...(userIsPremium ? {} : { apiKey: userConfig.openWeatherKey })
  }
};
```

### Option 2: Automatic Detection
Have the component auto-detect based on entitlements:

```jsx
const entitlements = useEntitlements(); // Get from context
const shouldUsePremium = entitlements.premium && !!import.meta.env.VITE_ENTITLEMENT_ENDPOINT;

return <Weather usePremium={shouldUsePremium} ... />;
```

### Option 3: Fallback Logic
If backend fails, fall back to direct API:

```jsx
const backendService = useBackendService('/v1/services/weather', params);

useEffect(() => {
  if (backendService.error?.includes('403')) {
    // Premium required, fall back to direct API
    useFallbackDirectAPI();
  } else if (backendService.error?.includes('401')) {
    // Auth failed
    showLoginPrompt();
  } else {
    setWeather(backendService.data);
  }
}, [backendService.error, backendService.data]);
```

## Testing

### Test Premium Access
```javascript
// In browser console
const token = localStorage.getItem('auth-token');

// Should return weather data
fetch('https://api-id.execute-api.us-east-1.amazonaws.com/prod/v1/services/weather?location=NYC', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### Test Free User Blocked
```javascript
// Free user (no DynamoDB record) should get:
// 403 Forbidden
// {"message": "Premium feature. Subscribe to access weather."}
```

## Summary

1. **Create once** - `useBackendService` hook handles all complexity
2. **Reuse existing components** - Add `usePremium` prop to toggle mode
3. **No duplication** - Single implementation for both free and premium flows
4. **Easy to test** - Toggle between modes by changing one prop
5. **Maintainable** - Update once, works everywhere

This is significantly cleaner than 6 duplicate widget components!
