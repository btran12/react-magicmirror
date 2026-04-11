# Widget Migration to Backend Services

This document explains how premium widgets work and how to migrate existing widgets to use backend-managed API keys.

## Current Architecture (Free)

**Old Weather widget flow:**
```
Weather component (direct)
  → apiKey from props
  → OpenWeatherMap API directly
  → Returns weather data
  → Widget displays data
```

**Problem:** Users must provide their own API keys. Premium users want services without keys.

## New Architecture (Premium)

**New WeatherBackend widget flow:**
```
WeatherBackend component
  → AuthContext (Cognito JWT)
  → Backend /v1/services/weather endpoint
    → JWT validation
    → DynamoDB premium check
    → If premium: OpenWeatherMap API with backend key
    → If free: 403 Forbidden
  → Returns weather data
  → Widget displays data
```

**Benefits:**
- Premium users don't need API keys
- Backend controls access (free vs premium)
- All API calls use backend-managed secrets
- Backend can enforce rate limits and quotas

## How to Migrate a Widget

### Example: Weather Widget

**Step 1: Create a backend handler**

Add to `entitlements-stack.yml` (follow the `WeatherFunction` pattern):

```yaml
YourServiceFunction:
  Type: AWS::Lambda::Function
  Properties:
    FunctionName: !Sub ${ProjectName}-${EnvironmentName}-yourservice
    Runtime: python3.12
    Handler: index.handler
    Role: !GetAtt ServicesFunctionRole.Arn
    Environment:
      Variables:
        SUBSCRIPTIONS_TABLE: !Ref SubscriptionsTable
        YOUR_API_KEY: !Ref YourApiKeyParameter
    Code:
      ZipFile: |
        import json
        import os
        import boto3

        dynamodb = boto3.resource("dynamodb")
        table = dynamodb.Table(os.environ["SUBSCRIPTIONS_TABLE"])
        API_KEY = os.environ["YOUR_API_KEY"]

        def _is_premium(user_id):
            result = table.get_item(Key={"userId": user_id})
            item = result.get("Item")
            if not item:
                return False
            plan = str(item.get("plan", "free")).lower()
            status = str(item.get("status", "active")).lower()
            return plan == "premium" and status in {"active", "trialing"}

        def handler(event, context):
            claims = event.get("requestContext", {}).get("authorizer", {}).get("jwt", {}).get("claims", {})
            user_id = claims.get("sub")
            
            if not user_id:
                return {"statusCode": 401, "body": json.dumps({"message": "Unauthorized"})}
            
            if not _is_premium(user_id):
                return {"statusCode": 403, "body": json.dumps({"message": "Premium feature required"})}
            
            # TODO: Call external API with API_KEY
            # Return the response
```

**Step 2: Add integration and route**

```yaml
YourServiceIntegration:
  Type: AWS::ApiGatewayV2::Integration
  Properties:
    ApiId: !Ref EntitlementsApi
    IntegrationType: AWS_PROXY
    IntegrationUri: !GetAtt YourServiceFunction.Arn

YourServiceRoute:
  Type: AWS::ApiGatewayV2::Route
  Properties:
    ApiId: !Ref EntitlementsApi
    RouteKey: GET /v1/services/yourservice
    AuthorizationType: JWT
    AuthorizerId: !Ref EntitlementsJwtAuthorizer
    Target: !Sub integrations/${YourServiceIntegration}

YourServiceFunctionPermission:
  Type: AWS::Lambda::Permission
  Properties:
    Action: lambda:InvokeFunction
    FunctionName: !Ref YourServiceFunction
    Principal: apigateway.amazonaws.com
    SourceArn: !Sub arn:${AWS::Partition}:execute-api:${AWS::Region}:${AWS::AccountId}:${EntitlementsApi}/*/GET/v1/services/yourservice
```

**Step 3: Create frontend component**

Copy `src/components/widgets/WeatherBackend.jsx` and adapt:

```jsx
export const YourServiceBackend = ({
  // your props
}) => {
  const auth = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const serviceEndpoint = import.meta.env.VITE_ENTITLEMENT_ENDPOINT?.replace(
    '/v1/entitlements/me',
    '/v1/services/yourservice'
  );

  useEffect(() => {
    if (!auth.isAuthenticated || !auth.user?.accessToken) {
      setError('Log in to access this service');
      return;
    }

    const fetchData = async () => {
      try {
        const response = await fetch(`${serviceEndpoint}?...your params...`, {
          headers: {
            'Authorization': `Bearer ${auth.user.accessToken}`,
          },
        });

        if (!response.ok) {
          const err = await response.json();
          if (response.status === 403) {
            setError('Premium feature required');
          } else {
            setError(err.message || 'Error fetching data');
          }
          return;
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [auth.isAuthenticated, auth.user?.accessToken, serviceEndpoint]);

  return (
    <Widget error={error} loading={loading}>
      {/* Render data */}
    </Widget>
  );
};
```

**Step 4: Update widgetConfig.js**

In `src/components/widgetConfig.js`, update the import and config to use the new backend component. For example, replace the direct `Weather` import with `WeatherBackend`.

## Full Migration Checklist

For each widget you want to migrate:

- [ ] Deploy CloudFormation with new Lambda function and API route
- [ ] Add API key parameter to CloudFormation deploy command (or use AWS Secrets Manager)
- [ ] Create `YourServiceBackend.jsx` component that calls `/v1/services/yourservice`
- [ ] Test as free user (should get 403)
- [ ] Add test record to DynamoDB to make user premium
- [ ] Test as premium user (should get data)
- [ ] Update `widgetConfig.js` to use new backend component
- [ ] Remove old direct API key prop from widget config

## Example: Gradual Migration

You don't have to migrate all at once:

1. Keep old `Weather` component (direct API) as-is
2. Add new `WeatherBackend` component
3. Add both to `widgetConfig.js` with different display names
4. Let users choose which version to use
5. Eventually deprecate the old direct version

## Error Handling

The backend returns:

- **401 Unauthorized** - No valid JWT or missing Cognito token
- **403 Forbidden** - User is not premium (free users get this)
- **400 Bad Request** - Missing or invalid query parameters
- **502/503** - External API is down
- **500** - Internal Lambda error

Always handle these gracefully in the frontend:

```jsx
if (response.status === 403) {
  setError('This is a premium feature. Upgrade to access it.');
} else if (response.status === 401) {
  setError('Please log in to use this service.');
} else {
  setError('Something went wrong. Try again later.');
}
```

## Testing

### Test Free User

1. Log in with a user that has no DynamoDB record
2. Open any backend-powered widget
3. Should show "Premium feature required"

### Test Premium User

1. Add a record to DynamoDB with `plan: "premium"`, `status: "active"`
2. Log in with that user's Cognito credentials
3. Open a backend-powered widget
4. Should show data (if the backend Lambda is working)

### Test Premium with Expired Subscription

1. Add a record with `plan: "premium"`, `status: "canceled"`
2. Log in with that user
3. Should still get 403 (cancelled is not in the allowed statuses)

## Next Steps

1. Deploy the weather service as shown above
2. Create `WeatherBackend` component (already done at `src/components/widgets/WeatherBackend.jsx`)
3. Test it with a premium user
4. Repeat for News, Stocks, Crypto, Holidays, etc.
5. After all services are migrated, set up Stripe webhooks to auto-manage DynamoDB records
