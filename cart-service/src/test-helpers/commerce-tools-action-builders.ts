import { CartSetCustomTypeAction } from '@commercetools/platform-sdk';
import {
  EXTENSION_TYPES_DATA_KEY,
  COUPON_CODES,
  EVALUATION_CURRENCY,
  EVALUATION_RESPONSE,
  COMMIT_ID,
} from '../lib/cart-constants';
import { DoveTechDiscountsResponse } from '../types/dovetech.types';

export const buildSetCustomTypeAction = (
  dtResponse: DoveTechDiscountsResponse,
  currencyCode: string,
  arrayOfCouponCodes: string[]
): CartSetCustomTypeAction => {
  const fields: { [key: string]: string | string[] } = {
    [COUPON_CODES]: arrayOfCouponCodes,
    [EVALUATION_RESPONSE]: JSON.stringify(dtResponse),
    [EVALUATION_CURRENCY]: currencyCode,
  };

  if (dtResponse.commitId && dtResponse.commitId !== null) {
    fields[COMMIT_ID] = dtResponse.commitId;
  }

  const setCustomTypeMetadataAction: CartSetCustomTypeAction = {
    action: 'setCustomType',
    type: {
      key: EXTENSION_TYPES_DATA_KEY,
      typeId: 'type',
    },
    fields: fields,
  };

  return setCustomTypeMetadataAction;
};
