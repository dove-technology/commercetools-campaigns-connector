import {
  CART_METADATA,
  COUPON_CODES,
  EVALUATION_CURRENCY,
  EVALUATION_RESPONSE,
} from './cart-constants';
import type {
  LineItem,
  CartUpdateAction,
  CartSetCustomTypeAction,
  CartSetDirectDiscountsAction,
  DirectDiscountDraft,
  Money,
} from '@commercetools/platform-sdk';
import {
  AddCouponCodeCartAction,
  CartActionType,
  CartOrOrder,
  CouponCode,
} from '../types/custom-commerce-tools.types';
import {
  CouponCodeAcceptedAction,
  CouponCodeRejectedAction,
  DoveTechActionType,
  DoveTechDiscountsResponse,
  DoveTechDiscountsResponseCost,
  DoveTechDiscountsResponseLineItem,
} from '../types/dovetech.types';
import { CurrencyValue } from './currency-value';
import { ExtensionResponse, CurrencyValueType } from '../types/index.types';
import { SHIPPING_COST_NAME } from './dovetech-property-constants';
import { getCartAction, getCartCurrencyCode } from './cart-helpers';

const invalidCouponCodeResponse: ExtensionResponse = {
  success: false,
  errorResponse: {
    statusCode: 400,
    message: 'Discount code is not applicable',
    errors: [
      {
        code: 'InvalidInput',
        message: 'Discount code is not applicable',
      },
    ],
  },
};

export default (
  dtResponse: DoveTechDiscountsResponse,
  commerceToolsCart: CartOrOrder
): ExtensionResponse => {
  if (commerceToolsCart.type === 'Order') {
    return {
      success: true,
      actions: [],
    };
  }

  const couponCodeRejectedActions = dtResponse.actions.filter(
    (a) => a.type === DoveTechActionType.CouponCodeRejected
  ) as CouponCodeRejectedAction[];

  if (newCouponCodeInvalid(couponCodeRejectedActions, commerceToolsCart)) {
    return invalidCouponCodeResponse;
  }

  const dtBasketItems = dtResponse.basket?.items ?? [];
  const actions: CartUpdateAction[] = [];

  const directDiscountAction = buildDirectDiscountAction(
    dtBasketItems,
    commerceToolsCart,
    dtResponse
  );

  if (directDiscountAction) {
    actions.push(directDiscountAction);
  }

  const couponCodeAcceptedActions = dtResponse.actions.filter(
    (a) => a.type === DoveTechActionType.CouponCodeAccepted
  ) as CouponCodeAcceptedAction[];

  const setCustomTypeAction = buildSetCustomTypeAction(
    dtResponse,
    couponCodeAcceptedActions,
    getCartCurrencyCode(commerceToolsCart)
  );

  actions.push(setCustomTypeAction);

  return {
    success: true,
    actions,
  };
};

const buildDirectDiscountAction = (
  dtBasketItems: DoveTechDiscountsResponseLineItem[],
  commerceToolsCart: CartOrOrder,
  dtResponse: DoveTechDiscountsResponse
) => {
  const discountActions = buildSetDirectDiscountForBasket(
    dtBasketItems,
    commerceToolsCart
  );

  const shippingCost = dtResponse.costs.find(
    (cost) => cost.name === SHIPPING_COST_NAME
  );

  const shippingDiscountAction = getDirectDiscountShippingAction(
    shippingCost,
    commerceToolsCart
  );

  if (shippingDiscountAction) {
    discountActions.push(shippingDiscountAction);
  }

  const action: CartSetDirectDiscountsAction = {
    action: 'setDirectDiscounts',
    discounts: discountActions,
  };

  if (
    discountActions.length > 0 ||
    (commerceToolsCart.directDiscounts &&
      commerceToolsCart.directDiscounts.length > 0)
  ) {
    return action;
  }

  return undefined;
};

const buildSetDirectDiscountForBasket = (
  dtBasketItems: DoveTechDiscountsResponseLineItem[],
  commerceToolsCart: CartOrOrder
): DirectDiscountDraft[] => {
  const currencyCode = getCartCurrencyCode(commerceToolsCart);
  const fractionDigits = commerceToolsCart.totalPrice.fractionDigits;

  const discountActions = dtBasketItems
    .filter((item) => item.totalAmountOff > 0)
    .map((item, index) => {
      const ctLineItem = commerceToolsCart.lineItems[index];
      return buildSetDirectDiscountForLineItem(
        item,
        ctLineItem,
        currencyCode,
        fractionDigits
      );
    });

  return discountActions;
};

const buildSetDirectDiscountForLineItem = (
  dtLineItem: DoveTechDiscountsResponseLineItem,
  ctLineItem: LineItem,
  currencyCode: string,
  fractionDigits: number
): DirectDiscountDraft => {
  const centAmount = getCurrencyValueInMinorUnits(
    dtLineItem.totalAmountOff,
    fractionDigits
  );

  const money: Money = {
    currencyCode,
    centAmount: centAmount,
  };

  return {
    value: {
      type: 'absolute',
      money: [money],
    },
    target: {
      type: 'lineItems',
      predicate: `sku = "${ctLineItem.variant.sku}"`,
    },
  };
};

const newCouponCodeInvalid = (
  couponCodeRejectedActions: CouponCodeRejectedAction[],
  commerceToolsCart: CartOrOrder
) => {
  if (couponCodeRejectedActions.length === 0) {
    return false;
  }

  const cartAction = getCartAction(commerceToolsCart);

  if (!cartAction || cartAction.type !== CartActionType.AddCouponCode) {
    return false;
  }

  const addCouponCodeAction = cartAction as AddCouponCodeCartAction;

  return couponCodeRejectedActions.some(
    (a) => a.code === addCouponCodeAction.code
  );
};

const getDirectDiscountShippingAction = (
  shippingCost: DoveTechDiscountsResponseCost | undefined,
  commerceToolsCart: CartOrOrder
): DirectDiscountDraft | undefined => {
  let shippingDiscount: DirectDiscountDraft | undefined;

  if (shippingCost?.totalAmountOff) {
    const fractionDigits = commerceToolsCart.totalPrice.fractionDigits;

    const centAmount = getCurrencyValueInMinorUnits(
      shippingCost.totalAmountOff,
      fractionDigits
    );

    const shippingDiscountMoney: Money = {
      centAmount: centAmount,
      currencyCode: getCartCurrencyCode(commerceToolsCart),
    };

    shippingDiscount = {
      value: {
        type: 'absolute',
        money: [shippingDiscountMoney],
      },
      target: {
        type: 'shipping',
      },
    };
  }

  return shippingDiscount;
};

const buildSetCustomTypeAction = (
  dtResponse: DoveTechDiscountsResponse,
  couponCodeAcceptedActions: CouponCodeAcceptedAction[],
  currencyCode: string
) => {
  const couponCodes: CouponCode[] = couponCodeAcceptedActions.map((a) => ({
    code: a.code,
  }));

  const serialisedCouponCodes = JSON.stringify(couponCodes);

  const setCustomTypeAction: CartSetCustomTypeAction = {
    action: 'setCustomType',
    type: {
      key: CART_METADATA,
      typeId: 'type',
    },
    fields: {
      // Note. We're removing the dovetech-discounts-cartAction field by not setting it
      [COUPON_CODES]: serialisedCouponCodes,
      [EVALUATION_RESPONSE]: JSON.stringify(dtResponse),
      [EVALUATION_CURRENCY]: currencyCode,
    },
  };
  return setCustomTypeAction;
};

const getCurrencyValueInMinorUnits = (
  amount: number,
  fractionalDigits: number
) => {
  const currencyValue = new CurrencyValue(
    amount,
    fractionalDigits,
    CurrencyValueType.CurrencyUnits
  );

  return currencyValue.toMinorUnits();
};
