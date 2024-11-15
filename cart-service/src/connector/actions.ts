import { ByProjectKeyRequestBuilder } from '@commercetools/platform-sdk/dist/declarations/src/generated/client/by-project-key-request-builder';
import {
  CART_METADATA,
  CART_ACTION,
  COUPON_CODES,
  EVALUATION_RESPONSE,
  EVALUATION_CURRENCY,
} from '../lib/cart-constants';

const CART_EXTENSION_KEY = 'dovetech-discountsExtension';

export async function createCartUpdateExtension(
  apiRoot: ByProjectKeyRequestBuilder,
  applicationUrl: string
): Promise<void> {
  const extension = await getExtension(apiRoot);

  if (!extension) {
    await apiRoot
      .extensions()
      .post({
        body: {
          key: CART_EXTENSION_KEY,
          destination: {
            type: 'HTTP',
            url: applicationUrl,
          },
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
  const {
    body: { results: types },
  } = await apiRoot
    .types()
    .get({
      queryArgs: {
        where: `key = "${CART_METADATA}"`,
      },
    })
    .execute();

  if (types.length === 0) {
    await apiRoot
      .types()
      .post({
        body: {
          key: CART_METADATA,
          name: {
            en: 'Dovetech Cart Metadata',
          },
          resourceTypeIds: ['order'],
          fieldDefinitions: [
            {
              type: {
                name: 'String',
              },
              name: COUPON_CODES,
              label: {
                en: 'Dovetech Coupon Codes',
              },
              required: false,
              inputHint: 'SingleLine',
            },
            {
              type: {
                name: 'String',
              },
              name: CART_ACTION,
              label: {
                en: 'Dovetech Cart Action',
              },
              required: false,
              inputHint: 'SingleLine',
            },
            {
              type: {
                name: 'String',
              },
              name: EVALUATION_RESPONSE,
              label: {
                en: 'Dovetech Evaluation Result',
              },
              required: false,
              inputHint: 'SingleLine',
            },
            {
              type: {
                name: 'String',
              },
              name: EVALUATION_CURRENCY,
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
