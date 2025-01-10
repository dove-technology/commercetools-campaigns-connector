import { it, expect } from '@jest/globals';
import { run } from './pre-undeploy';
import { deleteCartUpdateExtension } from './actions';

jest.mock('./actions');
jest.mock('../utils/config.utils');

it('pre-undeploy calls delete extension', async () => {
  await run();

  expect(deleteCartUpdateExtension).toHaveBeenCalled();
});
