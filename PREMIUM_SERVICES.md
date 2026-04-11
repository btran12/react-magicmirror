# Premium Widget Services Overview

This explains how premium users get access to services (weather, news, stocks, etc.) without entering individual API keys.

## The Problem We're Solving

**Before (Free users only):**
- User configures the Weather widget with their OpenWeather API key
- Widget calls OpenWeather API directly with that key
- User manages multiple API keys for multiple services
- Can't differentiate between free and paid tiers

**After (With premium):**
- User logs in with Cognito
- Premium users get badge in Settings
- Premium users can use all services without API keys
- Free users can still use services with their own API keys (old way)
- Backend manages all API keys securely

## Architecture

```
┌─────────────────────────┐
│   Frontend (React)      │
│                         │
│ Login → AuthContext     │
│         (Cognito JWT)   │
└────────────┬────────────┘
             │ Bearer token
             ↓
┌─────────────────────────────────────┐
│   API Gateway (HTTP API)            │
│                                     │
│   • JWT Authorizer (Cognito)       │
│   • CORS enabled                    │
└────────────┬────────────────────────┘
             │
      ┌──────┴──────┬────────────┐
      ↓             ↓            ↓
   GET /v1/      GET /v1/     GET /v1/
 entitlements   services/    services/
    /me         weather         news
      │             │            │
      ↓             ↓            ↓
┌──────────┐  ┌──────────┐  ┌──────────┐
│ Entitle- │  │ Weather  │  │  News    │
│ ments    │  │ Lambda   │  │ Lambda   │
│ Lambda   │  │ Handler  │  │ Handler  │
└─────┬────┘  └─────┬────┘  └─────┬────┘
      │             │            │
      ∨             ∨            ∨
┌──────────────────────────────────────┐
│         DynamoDB                     │
│  subscriptions table (premium check) │
└──────────────────────────────────────┘
      │
      └─→ Returns {premium, plan, status}
```

## The Flow

### 1. User Logs In

```javascript
// User enters email + password in Settings modal
// AuthContext handles Cognito auth
const login = async (email, password) => {
  const { signInUserSession } = await signIn({
    username: email,
    password
  });
  // accessToken now available for API calls
};
```

### 2. Check Premium Status

**Frontend** (Settings.jsx):
```javascript
const response = await fetch(
  'https://api.../prod/v1/entitlements/me',
  {
    headers: {
      'Authorization': `Bearer ${auth.user.accessToken}`
    }
  }
);
const { premium, plan } = await response.json();
// Show "Premium" (gold) or "Free" (gray) badge
```

**Backend** (Lambda):
```python
# Extract user's Cognito sub from JWT
user_id = event['claims']['sub']  # e.g., "us-east-1_xxx|user-123"

# Look up in DynamoDB
item = table.get_item(Key={'userId': user_id})

if item exists:
    plan = item['plan']      # "premium" or "free"
    status = item['status']  # "active", "trialing", or "canceled"
    premium = plan == "premium" AND status in ["active", "trialing"]
else:
    premium = False  # Default to free

return {
  "premium": premium,
  "plan": "premium" or "free",
  "status": "active" or "canceled",
  "currentPeriodEnd": "2026-12-31T00:00:00.000Z"  # if premium
}
```

### 3. Call a Premium Service

**Frontend** (WeatherBackend.jsx):
```javascript
// Premium user clicks Weather widget
const response = await fetch(
  'https://api.../prod/v1/services/weather?location=New%20York&tempUnit=F',
  {
    headers: {
      'Authorization': `Bearer ${auth.user.accessToken}`
    }
  }
);

if (response.status === 403) {
  // User is free, show upsell
  setError('Premium feature. Upgrade to access weather.');
} else {
  const weather = await response.json();
  // Display weather data
}
```

**Backend** (Lambda):
```python
# Extract user's Cognito sub from JWT
user_id = event['claims']['sub']

# Check if premium (same as entitlements)
if not is_premium(user_id):
    return {
        'statusCode': 403,
        'body': '{"message": "Premium feature required"}'
    }

# Premium! Call OpenWeather with backend API key
location = event['queryStringParameters']['location']
response = requests.get(
    f'https://api.openweathermap.org/data/2.5/weather',
    params={
        'q': location,
        'appid': os.environ['OPENWEATHER_API_KEY']  # Backend secret
    }
)

return {
    'statusCode': 200,
    'body': json.dumps(response.json())
}
```

## How Users Become Premium

### Right Now (Testing)

Manually add a DynamoDB record:

```
Table: blackdeck-dev-subscriptions
Item: {
  "userId": "us-east-1_xxx|user-123",  // Their Cognito sub
  "plan": "premium",
  "status": "active",
  "currentPeriodEnd": "2026-12-31T00:00:00.000Z"
}
```

Then that user:
1. Logs in
2. Gets "Premium" (gold) badge in Settings
3. Can call `/v1/services/weather`, etc. successfully

### Later (With Stripe)

Stripe webhook flow:

```
User buys subscription in app (Stripe checkout)
    ↓
Stripe sends webhook to Lambda function
    ↓
Webhook handler parses event
    ↓
Writes or updates DynamoDB record with:
  plan = "premium"
  status = "active"
  currentPeriodEnd = subscription renewal date
    ↓
User logs in or refreshes
    ↓
Premium badge appears automatically
```

## Testing the System

### Setup

1. **Deploy the backend:**
   ```bash
   aws cloudformation deploy \
     --template-file infra/cloudformation/entitlements-stack.yml \
     --stack-name blackdeck-entitlements \
     --parameter-overrides \
       CognitoUserPoolId=us-east-1_yz3WT2sdT \
       CognitoAppClientId=67vv566d0rt1g3odmekd48chjg \
       OpenWeatherApiKey=YOUR_OPENWEATHER_KEY \
     --capabilities CAPABILITY_NAMED_IAM
   ```

2. **Configure frontend:**
   ```bash
   # .env.local
   VITE_ENTITLEMENT_ENDPOINT=https://dnq7um1pgb.execute-api.us-east-1.amazonaws.com/prod/v1/entitlements/me
   ```

3. **Start dev server:**
   ```bash
   npm run dev
   ```

### Test Flow

**Test 1: Free User**

1. Sign up in Settings modal (will create Cognito user with no DynamoDB record)
2. See "Free" (gray) badge
3. Try to use Weather widget (if migrated to backend)
4. See error: "Premium feature required"

**Test 2: Premium User**

1. Create a test Cognito user (or use existing)
2. Get their `sub` from Cognito console
3. Add DynamoDB record (see Setup section)
4. Log in with that user
5. See "Premium" (gold) badge
6. Weather widget works and shows data
7. You can see the actual weather from OpenWeather API!

## Key Files

- **Backend**: `infra/cloudformation/entitlements-stack.yml` - CloudFormation stack
- **Backend**: `infra/cloudformation/README.md` - Deployment and testing guide
- **Frontend Auth**: `src/context/AuthContext.jsx` - Cognito integration
- **Frontend Settings**: `src/components/SettingsPanel.jsx` - Premium badge display
- **Frontend Example Widget**: `src/components/widgets/WeatherBackend.jsx` - How to migrate a widget
- **Migration Guide**: `infra/WIDGET_MIGRATION.md` - How to migrate all widgets

## Next Steps

1. **Test the current setup** (entitlements endpoint)
   - Log in
   - Check you get the correct premium/free badge

2. **Migrate widgets one by one**
   - Follow the pattern in `WeatherBackend.jsx`
   - Add backend handlers for News, Stocks, Crypto, Holidays
   - Test each one

3. **Set up Stripe** (later phase)
   - Create Stripe account and product
   - Build checkout page
   - Add webhook handler to update DynamoDB
   - Users buy subscription → automatically become premium

4. **Add rate limiting** (optional)
   - Track API calls per user in DynamoDB
   - Return 429 when quota exceeded
   - Different quotas for free vs premium

## Common Questions

**Q: Why use the backend instead of calling APIs directly?**
A: Users don't need API keys. Much better UX for premium. Backend can enforce quotas, access control, and use secrets securely.

**Q: Can free users still use services?**
A: Yes! Keep the old widget components for direct API calls. Users can choose.

**Q: When do users become premium?**
A: Right now: manually add DynamoDB records for testing. Later: automatically when they buy via Stripe.

**Q: What if the backend is down?**
A: Users get 500/503 errors. Frontend should show a friendly message and suggest retrying.

**Q: Can I add more services?**
A: Yes! Just add another Lambda function and API Gateway route following the weather pattern. See `WIDGET_MIGRATION.md` for details.
