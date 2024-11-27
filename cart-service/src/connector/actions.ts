import { ByProjectKeyRequestBuilder } from '@commercetools/platform-sdk/dist/declarations/src/generated/client/by-project-key-request-builder';
import { readConfiguration } from '../utils/config.utils';
import {
  CART_METADATA,
  CART_ACTION,
  COUPON_CODES,
  EVALUATION_RESPONSE,
  EVALUATION_CURRENCY,
  COMMIT_ID,
} from '../lib/cart-constants';
import { ExtensionDestination } from '@commercetools/platform-sdk';

const CART_EXTENSION_KEY = 'dovetech-discountsExtension';

export async function createCartUpdateExtension(
  apiRoot: ByProjectKeyRequestBuilder,
  applicationUrl: string
): Promise<void> {

  const extension = await getExtension(apiRoot);
  const configuration = readConfiguration();
  const encodedPassword = Buffer.from(configuration.basicAuthPwdCurrent).toString('base64');

  const destination : ExtensionDestination = {
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
  }else{
    await apiRoot
      .extensions()
      .withKey({ key: CART_EXTENSION_KEY })
      .post({
        body:{
          version: extension.version ,
          actions:[
            {
              action: 'changeDestination',
              destination:destination,
            }
          ]
        }
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
            {
              type: {
                name: 'String',
              },
              name: COMMIT_ID,
              label: {
                en: 'Dovetech Discounts Commit ID',
              },
              required: false,
              inputHint: 'SingleLine',
            }
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
