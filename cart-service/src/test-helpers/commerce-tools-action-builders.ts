import { CartSetCustomTypeAction } from '@commercetools/platform-sdk';
import {
  EXTENSION_TYPES_DATA_KEY,
  EXTENSION_TYPES_DATA_INTERNAL_KEY,
  COUPON_CODES,
  EVALUATION_CURRENCY,
  EVALUATION_RESPONSE,
  COMMIT_ID,
} from '../lib/cart-constants';
import { DoveTechDiscountsResponse } from '../types/dovetech.types';

export const buildSetCustomTypeActions = (
  dtResponse: DoveTechDiscountsResponse,
  currencyCode: string,
  arrayOfCouponCodes: string[]
): CartSetCustomTypeAction[] => {
  // metadata
  const fields: { [key: string]: string | string[] } = {
    [COUPON_CODES]: arrayOfCouponCodes,
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

  // metadata internal
  const setCustomTypeMetadataInternalAction: CartSetCustomTypeAction = {
    action: 'setCustomType',
    type: {
      key: EXTENSION_TYPES_DATA_INTERNAL_KEY,
      typeId: 'type',
    },
    fields: {
      [EVALUATION_RESPONSE]: JSON.stringify(dtResponse),
      [EVALUATION_CURRENCY]: currencyCode,
    },
  };

  return [setCustomTypeMetadataAction, setCustomTypeMetadataInternalAction];
};
