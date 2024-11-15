import { createApplicationLogger } from '@commercetools-backend/loggers';
import winston from 'winston';

export const logger = createApplicationLogger();

let loggerInstance: winston.Logger | undefined = undefined;

export const getLogger = () => {
  if (!loggerInstance) {
    loggerInstance = createApplicationLogger({
      level: process.env.LOG_LEVEL || 'info',
    });
  }

  return loggerInstance;
};
