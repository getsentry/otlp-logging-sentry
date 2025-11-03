// Load environment variables FIRST
import 'dotenv/config';

import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { LoggerProvider, BatchLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { Resource } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';

// Configure the OTLP log exporter
const logExporter = new OTLPLogExporter({
  url: process.env.OTEL_EXPORTER_OTLP_LOGS_ENDPOINT,
  headers: {
    'x-sentry-auth': process.env.OTEL_EXPORTER_OTLP_LOGS_HEADERS?.replace('x-sentry-auth=', '') || '',
  },
});

// Create resource
const resource = new Resource({
  [ATTR_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || 'payment-processing-service',
  [ATTR_SERVICE_VERSION]: process.env.OTEL_SERVICE_VERSION || '1.0.0',
});

// Create logger provider
const loggerProvider = new LoggerProvider({
  resource,
});

loggerProvider.addLogRecordProcessor(new BatchLogRecordProcessor(logExporter));

// Make logger provider available globally
global.loggerProvider = loggerProvider;

// Create SDK instance
const sdk = new NodeSDK({
  resource,
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-fs': {
        enabled: false,
      },
    }),
  ],
});

sdk.start();

console.log('OpenTelemetry logging initialized');
console.log(`Service: ${process.env.OTEL_SERVICE_NAME}`);

// Graceful shutdown
process.on('SIGTERM', () => {
  Promise.all([
    loggerProvider.shutdown(),
    sdk.shutdown(),
  ])
    .then(() => console.log('Logging terminated'))
    .catch((error) => console.error('Error shutting down logging', error))
    .finally(() => process.exit(0));
});
