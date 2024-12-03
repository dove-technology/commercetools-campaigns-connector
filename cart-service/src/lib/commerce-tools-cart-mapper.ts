import {
  COUPON_CODES,
  EVALUATION_CURRENCY,
  EVALUATION_RESPONSE,
} from './cart-constants';
import type {
  Address,
  LineItem,
  TypedMoney,
} from '@commercetools/platform-sdk';
import {
  AddCouponCodeCartAction,
  CartActionType,
  CartOrOrder,
} from '../types/custom-commerce-tools.types';
import {
  DoveTechDiscountsBasket,
  DoveTechDiscountsCost,
  DoveTechDiscountsCouponCode,
  DoveTechDiscountsDataInstance,
  DoveTechDiscountsLineItem,
  DoveTechDiscountsRequest,
  DoveTechDiscountsResponse,
  DoveTechDiscountsSettings,
  ShippingObject,
} from '../types/dovetech.types';
import { SHIPPING_COST_NAME } from './dovetech-property-constants';
import { getLogger } from '../utils/logger.utils';
import AggregateTotalMismatchError from '../errors/aggregate-total-mismatch.error';
import { getCartAction, getCartCurrencyCode } from './cart-helpers';
import { CurrencyValue } from './currency-value';
import { CurrencyValueType } from '../types/index.types';
import type { Configuration } from '../types/index.types';
import { merge } from 'object-mapper';

export default (
  commerceToolsCart: CartOrOrder,
  dataInstance: DoveTechDiscountsDataInstance,
  config: Configuration
): DoveTechDiscountsRequest => {
  const basket: DoveTechDiscountsBasket = {
    items: commerceToolsCart.lineItems.map((lineItem) => mapLineItem(lineItem)),
  };

  const costs: DoveTechDiscountsCost[] = [];
  const couponCodes: DoveTechDiscountsCouponCode[] = [];

  const context = {
    currencyCode: getCartCurrencyCode(commerceToolsCart),
  };

  const cartAction = getCartAction(commerceToolsCart);

  if (cartAction && cartAction.type === CartActionType.AddCouponCode) {
    const addCouponCodeAction = cartAction as AddCouponCodeCartAction;
    couponCodes.push({
      code: addCouponCodeAction.code,
    });
  }

  const arrayOfCouponCodesAsString =
    commerceToolsCart.custom?.fields[COUPON_CODES];

  if (arrayOfCouponCodesAsString) {
    const couponCodesFromCart: string[] = JSON.parse(
      arrayOfCouponCodesAsString
    );

    couponCodesFromCart.map((code: string) => {
      couponCodes.push({
        code: code,
      });
    });
  }

  const shippingCostInCurrency =
    getShippingCostInCurrencyUnits(commerceToolsCart);

  if (shippingCostInCurrency !== undefined) {
    costs.push({
      name: SHIPPING_COST_NAME,
      value: shippingCostInCurrency,
    });
  }

  const isOrder = commerceToolsCart.type === 'Order';

  const settings: DoveTechDiscountsSettings = {
    dataInstance,
    commit: isOrder,
    explain: false,
  };

  const expectedAggregateTotal = getExpectedAggregateTotal(
    isOrder,
    commerceToolsCart
  );

  if (isOrder) {
    verifyEvaluatedCartCurrencyMatchesOrderCurrency(commerceToolsCart);
  }

  const dtRequest: DoveTechDiscountsRequest = {
    basket,
    costs,
    couponCodes,
    context,
    settings,
    expectedAggregateTotal,
    billingAddress: buildAddressObject(commerceToolsCart.billingAddress),
    shippingAddress: buildAddressObject(commerceToolsCart.shippingAddress),
    shipping: buildShippingObject(commerceToolsCart),
    customer: buildCustomerObject(commerceToolsCart),
  };

  if (config.mappingConfiguration) {
    merge(commerceToolsCart, dtRequest, config.mappingConfiguration);
  }

  return dtRequest;
};

const mapLineItem = (lineItem: LineItem): DoveTechDiscountsLineItem => {
  return {
    quantity: lineItem.quantity,
    price: getLineItemPriceInCurrencyUnits(lineItem),
    hasProductDiscount: lineItem.price.discounted !== undefined,
    productId: lineItem.productId,
    productKey: lineItem.productKey,
    productTypeId: lineItem.productType?.id,
    variant: {
      key: lineItem.variant?.key,
      sku: lineItem.variant?.sku,
    },
  };
};

const getLineItemPriceInCurrencyUnits = (lineItem: LineItem) => {
  const price = getLineItemPrice(lineItem);

  return getMoneyInCurrencyUnits(price);
};

const getLineItemPrice = (lineItem: LineItem) => {
  return lineItem.price.discounted
    ? lineItem.price.discounted.value
    : lineItem.price.value;
};

const getShippingCostInCurrencyUnits = (commerceToolsCart: CartOrOrder) => {
  if (commerceToolsCart.shippingMode === 'Multiple') {
    const logger = getLogger();
    logger.warn(
      'Shipping cost for Multiple shipping methods are not mapped to Dovetech at present so shipping discounts will not apply'
    );
    return undefined;
  }

  if (!commerceToolsCart.shippingInfo) {
    return undefined;
  }

  return getMoneyInCurrencyUnits(commerceToolsCart.shippingInfo.price);
};

const getMoneyInCurrencyUnits = (money: TypedMoney) => {
  const currencyValue = new CurrencyValue(
    money.centAmount,
    money.fractionDigits,
    CurrencyValueType.MinorUnits
  );

  return currencyValue.toCurrencyUnits();
};

const buildShippingObject = (
  commerceToolsCart: CartOrOrder
): ShippingObject | undefined => {
  // note, shippingInfo will be undefined if shippingMode is Multiple (not mapped at present)
  if (!commerceToolsCart.shippingInfo?.shippingMethod?.id) {
    return undefined;
  }

  return {
    methodId: commerceToolsCart.shippingInfo.shippingMethod?.id,
  };
};

const buildAddressObject = (address: Address | undefined) => {
  if (!address) {
    return undefined;
  }

  return {
    countryCode: address.country,
  };
};

const buildCustomerObject = (commerceToolsCart: CartOrOrder) => {
  return {
    id: commerceToolsCart.customerId,
    email: commerceToolsCart.customerEmail,
    groupId: commerceToolsCart.customerGroup?.id,
  };
};

const verifyEvaluatedCartCurrencyMatchesOrderCurrency = (
  order: CartOrOrder
) => {
  const evaluationCurrency = order.custom?.fields[EVALUATION_CURRENCY];

  if (evaluationCurrency && evaluationCurrency !== getCartCurrencyCode(order)) {
    throw new AggregateTotalMismatchError();
  }
};

const getExpectedAggregateTotal = (
  isOrder: boolean,
  commerceToolsCart: CartOrOrder
) => {
  if (!isOrder) {
    return undefined;
  }

  const serialisedEvaluationResponse =
    commerceToolsCart.custom?.fields[EVALUATION_RESPONSE];

  if (!serialisedEvaluationResponse) {
    return undefined;
  }

  const previousDovetechResponse = JSON.parse(
    serialisedEvaluationResponse
  ) as DoveTechDiscountsResponse;

  return previousDovetechResponse.aggregates.total;
};
