import { createApplicationLogger } from '@commercetools-backend/loggers';
import winston from 'winston';
import { logs } from '@opentelemetry/api-logs';
import {
  LoggerProvider,
  BatchLogRecordProcessor,
} from '@opentelemetry/sdk-logs';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';

import { OpenTelemetryTransportV3 } from '@opentelemetry/winston-transport';

export const logger = createApplicationLogger();

let loggerInstance: winston.Logger | undefined = undefined;

export const getLogger = () => {
  if (!loggerInstance) {

    const otlpCollectorOptions = {
      url: `${process.env.OTEL_EXPORTER_OTLP_ENDPOINT}/v1/logs`,
      headers: {
        'api-key': process.env.OTEL_EXPORTER_OTLP_ENDPOINT_API_KEY!,
      },
      concurrencyLimit: 1,
    };
    
    const loggerProvider = new LoggerProvider();

    const logExporter = new OTLPLogExporter(otlpCollectorOptions);
    loggerProvider.addLogRecordProcessor(
      new BatchLogRecordProcessor(logExporter)
    );

    logs.setGlobalLoggerProvider(loggerProvider);

    loggerInstance = createApplicationLogger({
      level: process.env.LOG_LEVEL || 'info',
    });
    
    loggerInstance.add(new OpenTelemetryTransportV3())
  }

  return loggerInstance;
};
