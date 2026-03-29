# BlackDeck

A modern, interactive dashboard application built with React and Vite that displays real-time information through customizable widgets. BlackDeck provides a sleek, dark-themed interface for monitoring weather, news, stocks, crypto, sports, air quality, Reddit highlights, and more.

## 🌟 Features

### Interactive Dashboard
- **Hover Effects**: Widgets rise with elevation and white borders on hover
- **Per-Widget Editing**: Click any widget to customize settings
- **Add/Remove Widgets**: Easily add new widgets to empty slots
- **Multiple Presets**: Choose from 4 layout configurations
- **Dark Theme**: Sleek dark interface with gradient background
- **Responsive Design**: Adapts to different screen sizes

### Widgets Included
- **Clock** 🕐 - Real-time clock with 12/24 format toggle
- **Weather** 🌤️ - Current conditions and forecasts via OpenWeatherMap
- **Calendar** 📅 - Interactive monthly calendar with date highlighting
- **News** 📰 - Headlines merged from Currents API (primary) and Reddit (fallback/supplement)
- **Reddit** 👽 - Configurable subreddit post-title rotator
- **Stocks** 📈 - Stock ticker prices from Finnhub
- **Crypto** 💰 - Cryptocurrency prices and updates
- **Sports** ⚽ - Sports scores and updates
- **Air Quality** 💨 - Local air quality monitoring
- **Compliments** 💬 - Random compliments display

### Configuration
- **Global Default API Keys**: Set default keys for all services
- **Per-Widget Settings**: Override defaults for individual widgets
- **Layout Presets**:
  - **Classic** (7-slot layout): Standard 3-row grid
  - **Spotlight** (8-slot layout): Asymmetric layout with highlighted widget
  - **Quad + Footer** (7-slot layout): 2x2 grid with footer section
  - **3x3 Grid** (9-slot layout): Uniform 3x3 grid

### Smart Features
- **API Key Fallback**: Widgets fallback to global default keys when not specifically configured
- **Settings Auto-Hide**: Settings button fades after 5 seconds of mouse inactivity
- **Persistent Configuration**: All settings saved to localStorage
- **Smooth Animations**: CSS transitions for all interactions
- **News Aggregation**: News widget merges multiple sources and rotates up to 30 headlines
- **Reddit Scheduling Controls**: Poll interval, rotation interval, and per-subreddit title count are configurable

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm

### Installation

```bash
# Clone the repository
git clone https://github.com/btran12/react-magicmirror.git
cd react-magicmirror  # or rename to blackdeck

# Install dependencies
npm install
```

### Development

```bash
npm run dev
```

Opens at `http://localhost:5173` with HMR enabled for instant updates.

### Production Build

```bash
npm run build
npm run preview
```

## 🔑 API Keys Configuration

The application requires API keys from various services. You can set them globally in the Settings panel or per-widget in the dashboard.

### OpenWeatherMap (Weather Widget)
1. Visit [openweathermap.org/api](https://openweathermap.org/api)
2. Sign up for a free account
3. Copy your API key from account settings
4. Add to Settings panel under "Weather API Key"

### Currents API (News Widget - Primary)
1. Visit [currentsapi.services](https://currentsapi.services)
2. Create a free account
3. Copy your API key from the dashboard
4. Add to Settings panel under "Currents API Key"

### TheNewsAPI (News Widget - Optional)
1. Visit [thenewsapi.com](https://www.thenewsapi.com)
2. Create a free account
3. Copy your API key from the dashboard
4. Add to Settings panel under "TheNewsAPI Key" (optional fallback)

### Reddit API (News + Reddit Widgets)
- Public Reddit endpoints used in this project do not require an API key.
- The app fetches post titles from configured public subreddits.

### Finnhub (Stocks Widget)
1. Visit [finnhub.io](https://finnhub.io)
2. Register for a free account
3. Get your API key from the dashboard
4. Add to Settings panel under "Stocks API Key"

## 📁 Project Structure

```
blackdeck/
├── src/
│   ├── components/
│   │   ├── Dashboard.jsx              # Main dashboard grid layout
│   │   ├── SettingsPanel.jsx          # Settings and configuration modal
│   │   ├── Notifications.jsx          # Toast notification system
│   │   ├── Widget.jsx                 # Base widget wrapper
│   │   ├── WidgetSettingsForm.jsx     # Per-widget configuration form
│   │   ├── widgetConfig.js            # Widget metadata & layout presets
│   │   └── widgets/
│   │       ├── Clock.jsx
│   │       ├── Weather.jsx
│   │       ├── Calendar.jsx
│   │       ├── News.jsx
│   │       ├── Reddit.jsx
│   │       ├── Stocks.jsx
│   │       ├── Crypto.jsx
│   │       ├── Sports.jsx
│   │       ├── AirQuality.jsx
│   │       └── Compliments.jsx
│   ├── context/
│   │   └── WidgetContext.jsx          # Global state management
│   ├── hooks/
│   │   └── useAPI.js                  # Custom API fetching hook
│   ├── App.jsx
│   ├── App.css
│   ├── index.css
│   └── main.jsx
├── public/
│   └── compliments.json               # Compliments data
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── eslint.config.js
```

## 🎮 Usage Guide

### Dashboard Navigation
1. **Hover over widgets**: Widgets lift with shadow and white border appears
2. **Click on a widget**: Opens the settings modal for that widget
3. **Click on empty slot**: Choose a widget type and configure settings
4. **Remove widget**: Open slot editor and click "Remove Widget"

### Settings Panel
1. Click the **settings icon** (appears on mouse movement) in the top-right
2. **Select Layout Preset**: Choose your preferred dashboard layout
3. **Set Default API Keys**: Configure keys for Currents, TheNewsAPI (optional), Weather, and Stocks
4. **Per-Widget Override**: Configure individual widget keys in dashboard

### Reddit Widget Settings
- **Favorite Subreddits**: Comma-separated list like `news,worldnews,UpliftingNews`
- **Titles Per Subreddit**: How many top titles to fetch from each subreddit
- **Poll Interval (Minutes)**: How often Reddit data is refreshed (default: 30)
- **Rotation Interval (Seconds)**: How often titles rotate (default: 15)

### Adding a New Widget
1. Locate an empty slot on the dashboard
2. Hover to reveal the "Add Widget" prompt
3. Click to open the widget selector
4. Choose widget type and configure settings
5. Click "Save" to add to dashboard

## 🛠️ Technology Stack

### Frontend
- **React 19.2.4** - UI library
- **Vite 8.0.1** - Build tool
- **Tailwind CSS 4.2.2** - Styling
- **Material-UI (MUI)** - Component library

### State Management
- React Context API - Global state
- localStorage - Persistent configuration

### Dev Tools
- ESLint - Code linting
- PostCSS - CSS processing

## ⚙️ Available Scripts

```bash
# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## 🎨 Customization

### Adding a New Widget

1. Create `src/components/widgets/MyWidget.jsx`:

```jsx
import { Widget } from '../Widget';

export const MyWidget = () => {
  return (
    <Widget title="My Widget">
      <div>Your content here</div>
    </Widget>
  );
};
```

2. Register in `src/components/widgetConfig.js`:

```javascript
export const WIDGET_OPTIONS = [
  // ...existing options
  { value: 'myWidget', label: 'My Widget' },
];

export const WIDGET_LABELS = {
  // ...existing labels
  myWidget: 'My Widget',
};

export const createWidgetSettingsForType = (widgetType, defaults = {}) => {
  switch (widgetType) {
    case 'myWidget':
      return {
        widgetType,
        showFade: defaults.showFade ?? false,
      };
    default:
      return {
        widgetType,
        showFade: defaults.showFade ?? false,
      };
  }
};
```

### Changing the Theme

Edit `tailwind.config.js` to modify colors:

```javascript
colors: {
  gray: {
    950: '#050812',  // Background
    900: '#0a0e27',  // Secondary background
    // ... other colors
  }
}
```

### Creating a Custom Layout Preset

Edit `src/components/widgetConfig.js`:

```javascript
export const LAYOUT_PRESETS = {
  custom: {
    id: 'custom',
    name: 'Custom Layout',
    gridTemplateRows: 'repeat(3, 1fr)',
    rows: [
      // Define your row structure
    ]
  }
};
```

## 🐛 Troubleshooting

### API Key Not Working
- Verify the key is correct in Settings panel
- Check API service status
- Ensure rate limits haven't been exceeded
- Try removing and re-adding the widget

### Widget Not Updating
- Check browser console for errors
- Verify API key is configured
- Clear localStorage and refresh: `localStorage.clear()`
- Restart the development server

### Layout Not Saving
- Check browser console for storage quota errors
- Try clearing localStorage
- Ensure localStorage is enabled in browser

## 📦 Dependencies

See [package.json](package.json) for complete dependency list.

Core dependencies:
- `react` - React library
- `react-dom` - React DOM rendering
- `@mui/material` - Material Design components
- `@emotion/react` & `@emotion/styled` - Styling

## 🚀 Deployment

### Deploy to Vercel

```bash
npm run build
vercel
```

### Deploy to Netlify

```bash
npm run build
netlify deploy --prod --dir=dist
```

### Deploy to GitHub Pages

Update `vite.config.js`:
```javascript
export default {
  base: '/blackdeck/',
}
```

Then:
```bash
npm run build
git add dist -f
git commit -m "Deploy"
git push
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- Inspired by [MagicMirror²](https://magicmirror.builders/) — evolved into BlackDeck
- Widget icons from Material-UI
- API services: OpenWeatherMap, Currents API, Reddit, TheNewsAPI, Finnhub, ESPN
- Built with React and Vite

## 📞 Support

For issues, questions, or suggestions, please open an issue on the [GitHub repository](https://github.com/btran12/react-magicmirror).

---

**Last Updated**: March 2026 - BlackDeck includes interactive dashboard layouts, merged news sources, and a configurable Reddit widget.
