import CustomError from '../errors/custom.error';
import type { Configuration } from '../types/index.types';
import envValidators from '../validators/env.validators';
import { getValidateMessages } from '../validators/helpers.validators';

export const readConfiguration = (): Configuration => {
  const envVars: Configuration = {
    clientId: process.env.CTP_CLIENT_ID as string,
    clientSecret: process.env.CTP_CLIENT_SECRET as string,
    projectKey: process.env.CTP_PROJECT_KEY as string,
    scopes: process.env.CTP_SCOPES as string,
    region: process.env.CTP_REGION as string,
    dovetechApiHost: process.env.DOVETECH_API_HOST as string,
    dovetechApiKey: process.env.DOVETECH_API_KEY as string,
    basicAuthPwdCurrent: process.env.BASIC_AUTH_PASSWORD_CURRENT as string,
    basicAuthPwdPrevious: process.env.BASIC_AUTH_PASSWORD_PREVIOUS as string,
    otlpExporterEndpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT as string,
    otlpExporterEndpointApiKey: process.env
      .OTEL_EXPORTER_OTLP_ENDPOINT_API_KEY as string,
  };

  if (process.env.MAPPING_CONFIGURATION) {
    envVars.mappingConfiguration = JSON.parse(
      process.env.MAPPING_CONFIGURATION
    );
  }

  const validationErrors = getValidateMessages(envValidators, envVars);

  if (validationErrors.length) {
    throw new CustomError(
      'InvalidEnvironmentVariablesError',
      'Invalid Environment Variables please check your .env file',
      validationErrors
    );
  }

  return envVars;
};
