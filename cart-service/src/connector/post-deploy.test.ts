import { it, expect } from '@jest/globals';
import { run } from './post-deploy';
import { createCartUpdateExtension, createCustomTypes } from './actions';

jest.mock('./actions');
jest.mock('../utils/config.utils');

it('post-deploy calls create extension and custom types', async () => {
  await run();

  expect(createCartUpdateExtension).toHaveBeenCalled();
  expect(createCustomTypes).toHaveBeenCalled();
});
