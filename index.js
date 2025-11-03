// Import instrument.js first!
import './instrument.js';

import express from 'express';
import { logs, SeverityNumber } from '@opentelemetry/api-logs';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Get logger
const logger = logs.getLogger('payment-processing-service', '1.0.0');

// Helper to emit logs
function log(severity, severityNumber, message, attributes = {}) {
  logger.emit({
    severityNumber,
    severityText: severity,
    body: message,
    attributes,
  });
}

// Helper to simulate async operations
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Generate transaction ID
function generateTransactionId() {
  return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Main endpoint
app.post('/process-payment', async (req, res) => {
  const { userId, amount, paymentMethod, currency = 'USD' } = req.body;

  if (!userId || !amount || !paymentMethod) {
    log('ERROR', SeverityNumber.ERROR, 'Payment request missing required fields', {
      'error.type': 'validation_error',
      'user.id': userId || 'unknown',
      'payment.amount': amount || 0,
      'payment.method': paymentMethod || 'unknown',
    });
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const transactionId = generateTransactionId();

  try {
    // Step 1: Log payment request received
    log('INFO', SeverityNumber.INFO, 'Payment request received', {
      'user.id': userId,
      'payment.amount': amount,
      'payment.method': paymentMethod,
      'payment.currency': currency,
      'transaction.id': transactionId,
    });

    await delay(50);

    // Step 2: Validate payment details
    log('DEBUG', SeverityNumber.DEBUG, 'Validating payment details', {
      'user.id': userId,
      'transaction.id': transactionId,
      'validation.checks': 'amount,method,currency',
    });

    await delay(30);

    // Step 3: Initiate fraud check
    log('INFO', SeverityNumber.INFO, 'Initiating fraud check', {
      'user.id': userId,
      'transaction.id': transactionId,
      'fraud_check.provider': 'stripe-radar',
    });

    await delay(80);

    // Step 4: High-risk detection warning
    const riskScore = Math.random() * 100;
    if (riskScore > 70) {
      log('WARN', SeverityNumber.WARN, 'High-risk transaction detected', {
        'user.id': userId,
        'transaction.id': transactionId,
        'fraud_check.score': riskScore.toFixed(2),
        'fraud_check.threshold': 70,
        'fraud_check.reason': 'unusual_amount_pattern',
      });
    }

    await delay(40);

    // Step 5: Fraud check passed
    log('INFO', SeverityNumber.INFO, 'Fraud check passed', {
      'user.id': userId,
      'transaction.id': transactionId,
      'fraud_check.score': riskScore.toFixed(2),
      'fraud_check.status': 'passed',
    });

    // Step 6: Charging payment provider
    log('DEBUG', SeverityNumber.DEBUG, 'Charging payment provider', {
      'user.id': userId,
      'transaction.id': transactionId,
      'payment.provider': 'stripe',
      'payment.amount': amount,
      'payment.currency': currency,
    });

    await delay(120);

    // Step 7: Payment successful
    log('INFO', SeverityNumber.INFO, 'Payment processed successfully', {
      'user.id': userId,
      'transaction.id': transactionId,
      'payment.amount': amount,
      'payment.currency': currency,
      'payment.status': 'success',
      'payment.provider_id': `ch_${Math.random().toString(36).substr(2, 20)}`,
    });

    await delay(30);

    // Step 8: Update user balance
    log('DEBUG', SeverityNumber.DEBUG, 'Updating user balance', {
      'user.id': userId,
      'transaction.id': transactionId,
      'balance.previous': 1500.00,
      'balance.new': 1500.00 + amount,
      'balance.currency': currency,
    });

    await delay(40);

    // Step 9: Send receipt
    log('INFO', SeverityNumber.INFO, 'Sending payment receipt', {
      'user.id': userId,
      'transaction.id': transactionId,
      'notification.type': 'email',
      'notification.recipient': `user${userId}@example.com`,
    });

    res.json({
      success: true,
      transactionId,
      amount,
      currency,
      status: 'completed',
    });

  } catch (error) {
    log('ERROR', SeverityNumber.ERROR, 'Payment processing failed', {
      'user.id': userId,
      'transaction.id': transactionId,
      'error.type': error.name,
      'error.message': error.message,
      'payment.amount': amount,
    });

    res.status(500).json({
      error: 'Payment processing failed',
      transactionId,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Payment Processing Service running on http://localhost:${PORT}`);
  console.log(`Try: curl -X POST http://localhost:${PORT}/process-payment -H "Content-Type: application/json" -d '{"userId": "user123", "amount": 99.99, "paymentMethod": "credit_card"}'`);

  log('INFO', SeverityNumber.INFO, 'Payment service started', {
    'service.port': PORT,
    'service.environment': 'development',
  });
});
