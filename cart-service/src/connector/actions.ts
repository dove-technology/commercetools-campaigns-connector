import { ByProjectKeyRequestBuilder } from '@commercetools/platform-sdk/dist/declarations/src/generated/client/by-project-key-request-builder';
import { readConfiguration } from '../utils/config.utils';
import {
  CART_ACTION,
  COUPON_CODES,
  EVALUATION_RESPONSE,
  EVALUATION_CURRENCY,
  COMMIT_ID,
  EXTENSION_TYPES_METADATA_KEY,
  EXTENSION_TYPES_METADATA_LABEL,
  EXTENSION_TYPES_METADATA_INTERNAL_KEY,
  EXTENSION_TYPES_METADATA_INTERNAL_LABEL,
} from '../lib/cart-constants';
import { ExtensionDestination } from '@commercetools/platform-sdk';

const CART_EXTENSION_KEY = 'dovetech-discountsExtension';

export async function createCartUpdateExtension(
  apiRoot: ByProjectKeyRequestBuilder,
  applicationUrl: string
): Promise<void> {
  const extension = await getExtension(apiRoot);
  const configuration = readConfiguration();
  const encodedPassword = Buffer.from(
    configuration.basicAuthPwdCurrent
  ).toString('base64');

  const destination: ExtensionDestination = {
    type: 'HTTP',
    url: applicationUrl,
    authentication: {
      type: 'AuthorizationHeader',
      headerValue: `Basic ${encodedPassword}`,
    },
  };

  if (!extension) {
    await apiRoot
      .extensions()
      .post({
        body: {
          key: CART_EXTENSION_KEY,
          destination: destination,
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
      })
      .execute();
  } else {
    await apiRoot
      .extensions()
      .withKey({ key: CART_EXTENSION_KEY })
      .post({
        body: {
          version: extension.version,
          actions: [
            {
              action: 'changeDestination',
              destination: destination,
            },
          ],
        },
      })
      .execute();
  }
}

export async function deleteCartUpdateExtension(
  apiRoot: ByProjectKeyRequestBuilder
): Promise<void> {
  const extension = await getExtension(apiRoot);

  if (extension) {
    await apiRoot
      .extensions()
      .withKey({ key: CART_EXTENSION_KEY })
      .delete({
        queryArgs: {
          version: extension.version,
        },
      })
      .execute();
  }
}

export async function createCustomTypes(
  apiRoot: ByProjectKeyRequestBuilder
): Promise<void> {
  // create metadata types
  const {
    body: { results: types },
  } = await apiRoot
    .types()
    .get({
      queryArgs: {
        where: `key = "${EXTENSION_TYPES_METADATA_KEY}"`,
      },
    })
    .execute();

  if (types.length === 0) {
    await apiRoot
      .types()
      .post({
        body: {
          key: EXTENSION_TYPES_METADATA_KEY,
          name: {
            en: EXTENSION_TYPES_METADATA_LABEL,
          },
          resourceTypeIds: ['order'],
          fieldDefinitions: [
            {
              name: COMMIT_ID,
              type: {
                name: 'String',
              },
              label: {
                en: 'Dovetech Commit ID',
              },
              required: false,
              inputHint: 'SingleLine',
            },
            {
              name: COUPON_CODES,
              type: {
                name: 'Set',
                elementType: {
                  name: 'String',
                },
              },
              label: {
                en: 'Dovetech Coupon Codes',
              },
              required: false,
              inputHint: 'SingleLine',
            },
          ],
        },
      })
      .execute();
  }

  // create internal metadata types
  const {
    body: { results: internalTypes },
  } = await apiRoot
    .types()
    .get({
      queryArgs: {
        where: `key = "${EXTENSION_TYPES_METADATA_INTERNAL_KEY}"`,
      },
    })
    .execute();

  if (internalTypes.length === 0) {
    await apiRoot
      .types()
      .post({
        body: {
          key: EXTENSION_TYPES_METADATA_INTERNAL_KEY,
          name: {
            en: EXTENSION_TYPES_METADATA_INTERNAL_LABEL,
          },
          resourceTypeIds: ['order'],
          fieldDefinitions: [
            {
              name: CART_ACTION,
              type: {
                name: 'String',
              },
              label: {
                en: 'Dovetech Cart Action',
              },
              required: false,
              inputHint: 'SingleLine',
            },
            {
              name: EVALUATION_RESPONSE,
              type: {
                name: 'String',
              },
              label: {
                en: 'Dovetech Evaluation Result',
              },
              required: false,
              inputHint: 'SingleLine',
            },
            {
              name: EVALUATION_CURRENCY,
              type: {
                name: 'String',
              },
              label: {
                en: 'Dovetech Evaluation Currency',
              },
              required: false,
              inputHint: 'SingleLine',
            },
          ],
        },
      })
      .execute();
  }
}

async function getExtension(apiRoot: ByProjectKeyRequestBuilder) {
  const {
    body: { results: extensions },
  } = await apiRoot
    .extensions()
    .get({
      queryArgs: {
        where: `key = "${CART_EXTENSION_KEY}"`,
      },
    })
    .execute();

  return extensions.length === 0 ? undefined : extensions[0];
}
