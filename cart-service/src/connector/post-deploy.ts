import dotenv from 'dotenv';
dotenv.config();

import { createApiRoot } from '../client/create.client';
import { assertString } from '../utils/assert.utils';
import { createCartUpdateExtension, createCustomTypes } from './actions';
import { getLogger } from '../utils/logger.utils';

const CONNECT_APPLICATION_URL_KEY = 'CONNECT_SERVICE_URL';

async function postDeploy(properties: Map<string, unknown>): Promise<void> {
  // todo: remove this in time
  getLogger(false).info("In postDeploy function");
  const applicationUrl = properties.get(CONNECT_APPLICATION_URL_KEY);

  assertString(applicationUrl, CONNECT_APPLICATION_URL_KEY);

  const apiRoot = createApiRoot();
  await createCartUpdateExtension(apiRoot, applicationUrl);
  await createCustomTypes(apiRoot);
}

async function run(): Promise<void> {
  const logger = getLogger(false);

  try {
    logger.info('Running post-deploy...');
    const properties = new Map(Object.entries(process.env));
    await postDeploy(properties);
    logger.info('Successfully completed post-deploy...');
  } catch (error) {
    logger.error('Post-deploy failed:', error);
    process.exitCode = 1;
  }
}

run();
