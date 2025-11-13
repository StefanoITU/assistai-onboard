# Analyze Code Edge Function

This Supabase Edge Function forwards code analysis requests to a Make.com webhook for processing.

## Environment Variables

The following environment variable must be configured in your Supabase project:

- `MAKE_WEBHOOK_URL` (required): The Make.com webhook URL to forward code analysis requests to.

### Setting Environment Variables

To set environment variables for your Supabase Edge Functions:

1. Via Supabase Dashboard:
   - Go to your project settings
   - Navigate to Edge Functions > Secrets
   - Add `MAKE_WEBHOOK_URL` with your webhook URL

2. Via Supabase CLI:
   ```bash
   supabase secrets set MAKE_WEBHOOK_URL=your-webhook-url-here
   ```

## API

### POST /analyze-code

Accepts a JSON payload with code to analyze and forwards it to the configured webhook.

**Request Body:**
```json
{
  "code": "your code here"
}
```

**Response:**
Returns the response from the Make.com webhook.

**Error Responses:**
- `400`: Code parameter is required
- `500`: Webhook configuration error (missing MAKE_WEBHOOK_URL)
- `500`: Webhook request failed
