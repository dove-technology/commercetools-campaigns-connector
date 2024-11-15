import { ClientBuilder } from '@commercetools/sdk-client-v2';
import type {
  AuthMiddlewareOptions,
  HttpMiddlewareOptions,
} from '@commercetools/sdk-client-v2';
import { readConfiguration } from '../utils/config.utils';

const configuration = readConfiguration();

export const createClient = () =>
  new ClientBuilder()
    .withProjectKey(configuration.projectKey)
    .withClientCredentialsFlow(authMiddlewareOptions)
    .withHttpMiddleware(httpMiddlewareOptions)
    .build();

const httpMiddlewareOptions: HttpMiddlewareOptions = {
  host: `https://api.${configuration.region}.commercetools.com`,
};

const authMiddlewareOptions: AuthMiddlewareOptions = {
  host: `https://auth.${configuration.region}.commercetools.com`,
  projectKey: configuration.projectKey,
  credentials: {
    clientId: configuration.clientId,
    clientSecret: configuration.clientSecret,
  },
  scopes: [configuration.scopes],
};
