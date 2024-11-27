import {
  AmountOffAction,
  AmountOffType,
  DoveTechActionType,
} from '../types/dovetech.types';

export const buildAmountOffAction = (
  type: DoveTechActionType,
  amountOff: number,
  value = amountOff
): AmountOffAction => {
  return {
    id: crypto.randomUUID(),
    amountOff: amountOff,
    discountId: crypto.randomUUID(),
    type: type,
    amountOffType: AmountOffType.AmountOff,
    value,
  };
};
