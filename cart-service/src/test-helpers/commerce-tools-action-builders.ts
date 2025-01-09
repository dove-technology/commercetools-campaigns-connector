import { CartSetCustomTypeAction } from '@commercetools/platform-sdk';
import {
  EXTENSION_TYPES_DATA_KEY,
  COUPON_CODES,
  COMMIT_ID,
  DATA_INSTANCE,
  EVALUATION_RESULT_SUMMARY,
} from '../lib/cart-constants';
import {
  DoveTechDiscountsDataInstance,
  DoveTechDiscountsResponse,
} from '../types/dovetech.types';
import { EvaluationResultSummary } from '../types/custom-commerce-tools.types';

export const buildSetCustomTypeAction = (
  dtResponse: DoveTechDiscountsResponse,
  currencyCode: string,
  arrayOfCouponCodes: string[],
  dataInstance: string = DoveTechDiscountsDataInstance.Live
): CartSetCustomTypeAction => {
  const evaluationResultSummary: EvaluationResultSummary = {
    aggregateTotal: dtResponse.aggregates.total,
    currencyCode,
    actions: dtResponse.actions,
  };

  const fields: { [key: string]: string | string[] } = {
    [COUPON_CODES]: arrayOfCouponCodes,
    [EVALUATION_RESULT_SUMMARY]: JSON.stringify(evaluationResultSummary),
    [DATA_INSTANCE]: dataInstance,
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
