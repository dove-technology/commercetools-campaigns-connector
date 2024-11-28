import { CartSetCustomTypeAction } from '@commercetools/platform-sdk';
import {
  CART_METADATA,
  COUPON_CODES,
  EVALUATION_CURRENCY,
  EVALUATION_RESPONSE,
  COMMIT_ID,
} from '../lib/cart-constants';
import { DoveTechDiscountsResponse } from '../types/dovetech.types';

export const buildSetCustomTypeAction = (
  dtResponse: DoveTechDiscountsResponse,
  currencyCode: string,
  serialisedCouponCodes: string
): CartSetCustomTypeAction => {
  const fields: { [key: string]: string } = {
    [COUPON_CODES]: `${serialisedCouponCodes}`,
    [EVALUATION_RESPONSE]: JSON.stringify(dtResponse),
    [EVALUATION_CURRENCY]: currencyCode,
  };

  if (dtResponse.commitId && dtResponse.commitId !== null) {
    fields[COMMIT_ID] = dtResponse.commitId;
  }

  return {
    action: 'setCustomType',
    type: {
      key: CART_METADATA,
      typeId: 'type',
    },
    fields: fields,
  };
};
