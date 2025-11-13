# Analyze Code Edge Function

This Supabase Edge Function forwards code analysis requests to a Make.com webhook.

## Environment Variables

The following environment variable must be set in your Supabase project:

- `MAKE_WEBHOOK_URL`: The Make.com webhook URL for code analysis

To set this in Supabase:
```bash
supabase secrets set MAKE_WEBHOOK_URL=https://hook.eu2.make.com/your-webhook-id
```

## Rate Limiting

This function implements rate limiting:
- Maximum 10 requests per IP address per 60 seconds
- Returns 429 status code when limit exceeded

## Input Validation

- Code parameter must be a non-empty string
- Maximum code length: 100KB
- Returns 400 status code for invalid input
