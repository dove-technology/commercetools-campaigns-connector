import {
  AmountOffAction,
  AmountOffType,
  DoveTechActionType,
} from '../types/dovetech.types';

export const buildAmountOffBasketAction = (
  amountOff: number,
  value = amountOff
): AmountOffAction => {
  return {
    id: crypto.randomUUID(),
    amountOff: amountOff,
    discountId: crypto.randomUUID(),
    type: DoveTechActionType.AmountOffBasket,
    amountOffType: AmountOffType.AmountOff,
    value,
  };
};

export const buildAmountOffCostAction = (
  amountOff: number,
  value = amountOff
): AmountOffAction => {
  return {
    id: crypto.randomUUID(),
    amountOff: amountOff,
    discountId: crypto.randomUUID(),
    type: DoveTechActionType.AmountOffCost,
    amountOffType: AmountOffType.AmountOff,
    value,
  };
};
