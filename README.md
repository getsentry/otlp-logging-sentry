# OTLP Logging Starter - Payment Processing Service

This app **already has OpenTelemetry logging instrumentation**. Follow this guide to connect it to Sentry.

## What's Already Set Up

This app includes:
- ✅ OpenTelemetry SDK configured
- ✅ Structured logging throughout the code
- ✅ Multiple log severity levels (INFO, DEBUG, WARN, ERROR)
- ✅ Rich log attributes for every entry

**You just need to add Sentry as the OTLP destination!**

## Setup: Connect to Sentry (2 minutes)

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Get Sentry OTLP Credentials

1. Go to your Sentry project
2. Navigate to **Settings → Client Keys (DSN)**
3. Click the **OpenTelemetry** tab
4. Copy these two values:
   - **OTLP Logs Endpoint**
   - **OTLP Logs Endpoint Headers** (the auth key)

### Step 3: Create `.env` File

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Then edit `.env` and replace the placeholders with your Sentry credentials:

```bash
OTEL_EXPORTER_OTLP_LOGS_ENDPOINT=https://o{YOUR_ORG_ID}.ingest.us.sentry.io/api/{YOUR_PROJECT_ID}/integration/otlp/v1/logs
OTEL_EXPORTER_OTLP_LOGS_HEADERS=x-sentry-auth=sentry sentry_key={YOUR_PUBLIC_KEY}
```

### Step 4: Start the Service

```bash
npm start
```

### Step 5: Generate Logs

Run this command to process a payment:

```bash
curl -X POST http://localhost:3000/process-payment \
  -H "Content-Type: application/json" \
  -d '{"userId": "user123", "amount": 99.99, "paymentMethod": "credit_card"}'
```

### Step 6: View in Sentry

1. Go to **Sentry → Logs**
2. Filter by service: `payment-processing-service`
3. Explore the structured logs!

## What You'll See in Sentry

A rich log flow showing the complete payment processing workflow:

1. **[INFO]** Payment request received
   - `user.id`, `payment.amount`, `transaction.id`

2. **[DEBUG]** Validating payment details
   - `validation.checks`

3. **[INFO]** Initiating fraud check
   - `fraud_check.provider`

4. **[WARN]** High-risk transaction detected *(~30% of requests)*
   - `fraud_check.score`, `fraud_check.threshold`

5. **[INFO]** Fraud check passed
   - `fraud_check.status`

6. **[DEBUG]** Charging payment provider
   - `payment.provider`, `payment.amount`

7. **[INFO]** Payment processed successfully
   - `payment.status`, `payment.provider_id`

8. **[DEBUG]** Updating user balance
   - `balance.previous`, `balance.new`

9. **[INFO]** Sending payment receipt
   - `notification.type`, `notification.recipient`

## Understanding the Code

### Where Logs Are Created

Look at `index.js` to see how logs are instrumented:

```javascript
// Custom log example from the code
log('INFO', SeverityNumber.INFO, 'Payment request received', {
  'user.id': userId,
  'payment.amount': amount,
  'transaction.id': transactionId,
});
```

### OpenTelemetry Configuration

Check `instrument.js` to see the OTLP log exporter setup:

```javascript
const logExporter = new OTLPLogExporter({
  url: process.env.OTEL_EXPORTER_OTLP_LOGS_ENDPOINT,
  headers: {
    'x-sentry-auth': process.env.OTEL_EXPORTER_OTLP_LOGS_HEADERS
  },
});
```

**That's it!** Your existing OpenTelemetry logging now sends data to Sentry.

## Test Error Scenarios

**Trigger validation error:**
```bash
curl -X POST http://localhost:3000/process-payment \
  -H "Content-Type: application/json" \
  -d '{"userId": "user123"}'
```

You'll see an **[ERROR]** log with `error.type: validation_error`

## Next Steps

- Explore log attributes in Sentry UI
- Filter logs by severity level or custom attributes
- Add more structured logging to your code
- Switch to a different OTLP backend anytime (vendor-neutral!)
