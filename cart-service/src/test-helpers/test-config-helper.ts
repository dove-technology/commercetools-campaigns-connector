import { Configuration } from '../types/index.types';

export const getConfig = (
  overrides?: Partial<Configuration>
): Configuration => {
  return {
    clientId: 'mockedClientId',
    clientSecret: 'mockedClientSecret',
    projectKey: 'mockedProjectKey',
    region: 'mockedRegion',
    scopes: 'scopes',
    dovetechApiHost: 'https://example.com',
    basicAuthPwdCurrent: 'thisIsTheCurrentPassword',
    basicAuthPwdPrevious: 'thisWasThePreviousPassword',
    dovetechApiKey: 'API-KEY',
    otlpExporterEndpoint: 'https://example.com',
    otlpExporterEndpointApiKey: 'API-KEY',
    ...overrides,
  };
};
