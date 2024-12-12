import winston from 'winston';
import dotenv from 'dotenv';
dotenv.config();

import { createApiRoot } from '../client/create.client';
import { assertString } from '../utils/assert.utils';
import { createCartUpdateExtension, createCustomTypes } from './actions';
import { getLogger } from '../utils/logger.utils';

const CONNECT_APPLICATION_URL_KEY = 'CONNECT_SERVICE_URL';

async function postDeploy(
  properties: Map<string, unknown>,
  logger: winston.Logger
): Promise<void> {
  // todo: remove this in time
  logger.info('In postDeploy function');
  const applicationUrl = properties.get(CONNECT_APPLICATION_URL_KEY);

  assertString(applicationUrl, CONNECT_APPLICATION_URL_KEY);

  const apiRoot = createApiRoot();
  await createCartUpdateExtension(apiRoot, applicationUrl);
  await createCustomTypes(apiRoot);
}

async function run(): Promise<void> {
  const logger = getLogger(false);

  // logger.on('finish', function () {
  //   process.exit();
  // });

  try {
    logger.info('Running post-deploy...');
    const properties = new Map(Object.entries(process.env));
    await postDeploy(properties, logger);
    logger.info('Successfully completed post-deploy...');
  } catch (error) {
    logger.error('Post-deploy failed:', error);
    process.exitCode = 1;
  } finally {
    // logger.end();
  }
}

run();
