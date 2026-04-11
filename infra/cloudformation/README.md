# Entitlement & Services Backend Stack

This stack creates the AWS backend for Blackdeck's premium feature with complete service proxies:

- DynamoDB subscriptions table
- Lambda entitlement handler (`GET /v1/entitlements/me`)
- Lambda service handlers for all 6 premium services
- API Gateway HTTP API with Cognito JWT authorizer

## What the stack gives you

**Entitlements:**
- `GET /v1/entitlements/me` - Check user premium status

**Premium Services:**
- `GET /v1/services/weather` - Current weather data
- `GET /v1/services/news` - Latest news headlines
- `GET /v1/services/stocks` - Stock quotes
- `GET /v1/services/crypto` - Cryptocurrency prices
- `GET /v1/services/holidays` - Upcoming US holidays
- `GET /v1/services/sports` - Sports scores and events

All endpoints:
- Require Cognito JWT authentication
- Are blocked for free users (403 Forbidden)
- Use backend-managed API keys (never exposed to frontend)

## Deployment

You'll need API keys for:
- OpenWeather (https://openweathermap.org/api) - free tier OK
- Currents API (https://currentsapi.services) - free tier available
- Finnhub (https://finnhub.io) - free tier OK
- API Ninjas (https://api-ninjas.com) - free tier available

Run from the repository root:

```bash
aws cloudformation deploy \
  --stack-name blackdeck-entitlements-dev \
  --template-file infra/cloudformation/entitlements-stack.yml \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides \
    ProjectName=blackdeck \
    EnvironmentName=dev \
    StageName=prod \
    CognitoUserPoolId=us-east-1_yz3WT2sdT \
    CognitoAppClientId=67vv566d0rt1g3odmekd48chjg \
    CognitoRegion=us-east-1 \
    AllowedOrigins='http://localhost:5173,https://d84l1y8p4kdic.cloudfront.net' \
    OpenWeatherApiKey='YOUR_OPENWEATHER_KEY' \
    CurrentsApiKey='YOUR_CURRENTS_API_KEY' \
    FinnhubApiKey='YOUR_FINNHUB_KEY' \
    ApiNinjasApiKey='YOUR_API_NINJAS_KEY'
```

## After deploy

CloudFormation outputs will show all service endpoints. Update `.env.local`:

```bash
VITE_ENTITLEMENT_ENDPOINT=https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/prod/v1/entitlements/me
```

## Using the Endpoints

### Check Premium Status

All authenticated users can call this:

```bash
curl -H "Authorization: Bearer $JWT_TOKEN" \
  "https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/prod/v1/entitlements/me"
```

Response:
```json
{
  "premium": false,
  "plan": "free",
  "status": "active"
}
```

### Weather (Premium Only)

```bash
curl -H "Authorization: Bearer $JWT_TOKEN" \
  "https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/prod/v1/services/weather?location=New%20York&tempUnit=F"
```

Query Parameters:
- `location` (required): City name
- `tempUnit` (optional): `C` or `F`, default `F`

### News (Premium Only)

```bash
curl -H "Authorization: Bearer $JWT_TOKEN" \
  "https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/prod/v1/services/news"
```

Response: Array of latest news articles with title, description, URL, etc.

### Stocks (Premium Only)

```bash
curl -H "Authorization: Bearer $JWT_TOKEN" \
  "https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/prod/v1/services/stocks?ticker=AAPL"
```

Query Parameters:
- `ticker` (required): Stock ticker (e.g., AAPL, GOOGL, MSFT)

Response: Finnhub quote object with price, change, etc.

### Crypto (Premium Only)

```bash
curl -H "Authorization: Bearer $JWT_TOKEN" \
  "https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/prod/v1/services/crypto?ids=bitcoin,ethereum"
```

Query Parameters:
- `ids` (required): Comma-separated crypto IDs (e.g., bitcoin, ethereum, cardano)

Response: CoinGecko prices in USD with 24h change

### Holidays (Premium Only)

```bash
curl -H "Authorization: Bearer $JWT_TOKEN" \
  "https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/prod/v1/services/holidays"
```

Response: Array of US public holidays with name, date, type

### Sports (Premium Only)

```bash
curl -H "Authorization: Bearer $JWT_TOKEN" \
  "https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/prod/v1/services/sports?sport=baseball&league=mlb&startDate=20260411&endDate=20260415"
```

Query Parameters:
- `sport` (required): Sport name (e.g., baseball, basketball, football, hockey)
- `league` (required): League code (e.g., mlb, nba, nfl, nhl)
- `startDate` (optional): YYYYMMDD format
- `endDate` (optional): YYYYMMDD format

Response: ESPN scoreboard object with events, scores, status

## DynamoDB Schema

**Table**: `blackdeck-dev-subscriptions`

**Primary Key**: `userId` (Cognito user's `sub` claim)

**Attributes**:
- `plan` (String): `"premium"` or `"free"`
- `status` (String): `"active"`, `"trialing"`, or `"canceled"`
- `currentPeriodEnd` (String, optional): ISO 8601 timestamp when subscription renews

### Example Free User
```json
{
  "userId": "us-east-1_xxx|user-123",
  "plan": "free",
  "status": "active"
}
```

### Example Premium User
```json
{
  "userId": "us-east-1_xxx|user-456",
  "plan": "premium",
  "status": "active",
  "currentPeriodEnd": "2026-12-31T00:00:00.000Z"
}
```

## Testing

### Get a JWT

In your browser's console after logging in:
```javascript
// Get the auth token
const token = localStorage.getItem('auth-token');
// or from Cognito's stored metadata if using Amplify
```

### Test Free User vs Premium

**As free user (no DynamoDB record):**
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "https://YOUR_API_ID/prod/v1/services/weather?location=NYC"
# Returns 403 Forbidden
# {"message": "Premium feature. Subscribe to access weather."}
```

**As premium user:**

1. Add a record to DynamoDB:
   - Table: `blackdeck-dev-subscriptions`
   - userId: `YOUR_COGNITO_SUB` (get from `auth.user.userId` in browser)
   - plan: `premium`
   - status: `active`

2. Then the same call works:
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "https://YOUR_API_ID/prod/v1/services/weather?location=NYC"
# Returns weather JSON from OpenWeather
```

## Frontend Components

Corresponding React components are included for each service:
- `src/components/widgets/WeatherBackend.jsx`
- `src/components/widgets/NewsBackend.jsx`
- `src/components/widgets/StocksBackend.jsx`
- `src/components/widgets/CryptoBackend.jsx`
- `src/components/widgets/HolidaysBackend.jsx`
- `src/components/widgets/SportsBackend.jsx`

Each component:
- Gets JWT from `AuthContext`
- Calls the corresponding `/v1/services/*` endpoint
- Shows "Premium feature required" error for free users
- Requires `VITE_ENTITLEMENT_ENDPOINT` to be configured

## Premium Determination

User is premium if:
- DynamoDB record exists
- `plan` is `"premium"`
- `status` is `"active"` OR `"trialing"`

Free users (or records without these conditions) get 403 responses.

## Adding More Services

To add another service (e.g., flights, hotels, etc.):

1. **Add a new Lambda parameter** in the Parameters section
2. **Create a new Lambda function** following the pattern in the CloudFormation
3. **Create an integration and route** for the API Gateway
4. **Create a frontend React component** following the pattern
5. **Update this README** with the new endpoint

See `WIDGET_MIGRATION.md` for detailed examples.

## Useful follow-up

- Wire Stripe webhooks to auto-update DynamoDB when users subscribe
- Add rate limiting per user per service
- Add usage metering and quotas
- Migrate remaining widgets to use backend services