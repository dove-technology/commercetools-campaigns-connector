import {
  COMMIT_ID,
  COUPON_CODES,
  DATA_INSTANCE,
  EVALUATION_CURRENCY,
  EVALUATION_RESPONSE,
  EXTENSION_TYPES_DATA_KEY,
} from './cart-constants';
import type {
  LineItem,
  CartUpdateAction,
  CartSetCustomTypeAction,
  CartSetDirectDiscountsAction,
  DirectDiscountDraft,
  Money,
  FieldContainer,
} from '@commercetools/platform-sdk';
import {
  AddCouponCodeCartAction,
  CartActionType,
  CartOrOrder,
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
import {
  getCartAction,
  getCartCurrencyCode,
  getCartDataInstance,
} from './cart-helpers';

const invalidCouponCodeResponse: ExtensionResponse = {
  success: false,
  errorResponse: {
    statusCode: 400,
    message: 'Discount code is not applicable',
  },
};

export default (
  dtResponse: DoveTechDiscountsResponse,
  commerceToolsCart: CartOrOrder
): ExtensionResponse => {
  const actions: CartUpdateAction[] = [];
  let commitId: string | null = null;

  if (commerceToolsCart.type !== 'Order') {
    const couponCodeRejectedActions = dtResponse.actions.filter(
      (a) => a.type === DoveTechActionType.CouponCodeRejected
    ) as CouponCodeRejectedAction[];

    if (newCouponCodeInvalid(couponCodeRejectedActions, commerceToolsCart)) {
      return invalidCouponCodeResponse;
    }

    const dtBasketItems = dtResponse.basket?.items ?? [];

    const directDiscountAction = buildDirectDiscountAction(
      dtBasketItems,
      commerceToolsCart,
      dtResponse
    );

    if (directDiscountAction) {
      actions.push(directDiscountAction);
    }
  } else {
    commitId = dtResponse.commitId;
  }

  const couponCodeAcceptedActions = dtResponse.actions.filter(
    (a) => a.type === DoveTechActionType.CouponCodeAccepted
  ) as CouponCodeAcceptedAction[];

  const setCustomTypeAction = buildSetCustomTypeAction(
    dtResponse,
    couponCodeAcceptedActions,
    getCartCurrencyCode(commerceToolsCart),
    getCartDataInstance(commerceToolsCart),
    commitId
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
    .map((item, index) => {
      // line items from Dovetech are returned in the same order as they are passed in
      const ctLineItem = commerceToolsCart.lineItems[index];

      if (item.totalAmountOff === 0) {
        return undefined;
      }

      return buildSetDirectDiscountForLineItem(
        item,
        ctLineItem,
        currencyCode,
        fractionDigits
      );
    })
    .filter((item) => item !== undefined) as DirectDiscountDraft[];

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
  currencyCode: string,
  dataInstance: string,
  commitId: string | null = null
) => {
  const fields: FieldContainer = {
    [COUPON_CODES]: couponCodeAcceptedActions.map((a) => a.code),
    // Note. We're removing the dovetech-discounts-cart-action field by not setting it
    [EVALUATION_RESPONSE]: JSON.stringify(dtResponse),
    [EVALUATION_CURRENCY]: currencyCode,
    [DATA_INSTANCE]: dataInstance,
  };

  if (commitId && commitId !== null) {
    fields[COMMIT_ID] = commitId;
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
