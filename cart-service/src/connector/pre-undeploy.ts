import dotenv from 'dotenv';
dotenv.config();

import { createApiRoot } from '../client/create.client';
import { deleteCartUpdateExtension } from './actions';
import { getLogger } from '../utils/logger.utils';

async function preUndeploy(): Promise<void> {
  // todo: remove this in time
  getLogger(false).info("In preUndeploy function");
  const apiRoot = createApiRoot();
  await deleteCartUpdateExtension(apiRoot);
}

async function run(): Promise<void> {
  const logger = getLogger(false);
  try {
    logger.info('Running pre-undeploy...');
    await preUndeploy();
    logger.info('Successfully completed pre-undeploy...');
  } catch (error) {
    logger.error('Pre-undeploy failed:', error);
    process.exitCode = 1;
  }
}

run();
