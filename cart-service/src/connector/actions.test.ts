import { it, expect, beforeEach, describe } from '@jest/globals';
import {
  createCartUpdateExtension,
  deleteCartUpdateExtension,
  createCustomTypes,
} from './actions';
import { readConfiguration } from '../../src/utils/config.utils';
import { ByProjectKeyRequestBuilder } from '@commercetools/platform-sdk';

jest.mock('../utils/config.utils');

let mockDelete: typeof jest.fn;
let mockPost: typeof jest.fn;

const emptyGetResponse = {
  body: {
    results: [],
  },
};

const getExtensionsResponse = {
  body: {
    results: [
      {
        key: 'dovetech-discounts-extension',
        version: 1,
      },
    ],
  },
};

const serviceUrl = 'https://example.com/cart-service';

const extensionDestination = {
  type: 'HTTP',
  url: serviceUrl,
  authentication: {
    type: 'AuthorizationHeader',
    headerValue: 'Basic dGhpc0lzVGhlQ3VycmVudFBhc3N3b3Jk',
  },
};

beforeEach(() => {
  (readConfiguration as jest.Mock).mockClear();

  mockDelete = jest.fn().mockReturnThis();
  mockPost = jest.fn().mockReturnThis();
});

describe('createCartUpdateExtension', () => {
  it('when cart extension does not exist it should be created', async () => {
    const mockApiRoot = getMockApiRoot(emptyGetResponse);
    await createCartUpdateExtension(mockApiRoot, serviceUrl);

    expect(mockPost).toHaveBeenCalledWith({
      body: {
        key: 'dovetech-discounts-extension',
        destination: extensionDestination,
        triggers: [
          {
            resourceTypeId: 'cart',
            actions: ['Create', 'Update'],
          },
          {
            resourceTypeId: 'order',
            actions: ['Create'],
          },
        ],
      },
    });
  });

  it('when cart extension exists it should be updated', async () => {
    const mockApiRoot = getMockApiRoot(getExtensionsResponse);

    await createCartUpdateExtension(mockApiRoot, serviceUrl);

    expect(mockPost).toHaveBeenCalledWith({
      body: {
        version: 1,
        actions: [
          {
            action: 'changeDestination',
            destination: extensionDestination,
          },
        ],
      },
    });
  });
});

describe('deleteCartUpdateExtension', () => {
  it('when cart extension exists it should be deleted', async () => {
    const mockApiRoot = getMockApiRoot(getExtensionsResponse);

    await deleteCartUpdateExtension(mockApiRoot);

    expect(mockDelete).toHaveBeenCalledWith({
      queryArgs: {
        version: 1,
      },
    });
  });

  it('when cart extension does not exist then nothing deleted', async () => {
    const mockApiRoot = getMockApiRoot(emptyGetResponse);

    await deleteCartUpdateExtension(mockApiRoot);

    expect(mockDelete).not.toHaveBeenCalled();
  });
});

describe('createCustomTypes', () => {
  it('when custom type does not exist it should be created', async () => {
    const mockApiRoot = getMockApiRoot(emptyGetResponse);

    await createCustomTypes(mockApiRoot);

    expect(mockPost).toHaveBeenCalledWith({
      body: {
        key: 'dovetech-discounts-extension-data',
        name: {
          en: 'Dovetech Extension Data',
        },
        resourceTypeIds: ['order'],
        fieldDefinitions: expect.arrayContaining([
          expect.objectContaining({
            name: 'dovetech-discounts-coupon-codes',
          }),
          expect.objectContaining({
            name: 'dovetech-discounts-commit-id',
          }),
          expect.objectContaining({
            name: 'dovetech-discounts-cart-action',
          }),
          expect.objectContaining({
            name: 'dovetech-discounts-evaluation-result-summary',
          }),
          expect.objectContaining({
            name: 'dovetech-discounts-data-instance',
          }),
        ]),
      },
    });
  });

  it('when custom type exists it should not be created', async () => {
    const getTypesResponse = {
      body: {
        results: [
          {
            key: 'dovetech-discounts-extension-data',
            version: 1,
          },
        ],
      },
    };
    const mockApiRoot = getMockApiRoot(getTypesResponse);

    await createCustomTypes(mockApiRoot);

    expect(mockPost).not.toHaveBeenCalled();
  });
});

const getMockApiRoot = (mockGetResponse: object) => {
  return {
    extensions: jest.fn().mockReturnThis(),
    types: jest.fn().mockReturnThis(),
    get: jest.fn().mockReturnThis(),
    withKey: jest.fn().mockReturnThis(),
    delete: mockDelete,
    post: mockPost,
    execute: jest.fn().mockResolvedValue(mockGetResponse),
  } as unknown as ByProjectKeyRequestBuilder;
};
