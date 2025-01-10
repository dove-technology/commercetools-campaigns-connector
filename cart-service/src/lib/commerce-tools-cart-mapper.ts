import {
  COUPON_CODES,
  DATA_INSTANCE,
  EVALUATION_RESULT_SUMMARY,
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
  EvaluationResultSummary,
} from '../types/custom-commerce-tools.types';
import {
  DoveTechDiscountsBasket,
  DoveTechDiscountsCost,
  DoveTechDiscountsCouponCode,
  DoveTechDiscountsDataInstance,
  DoveTechDiscountsLineItem,
  DoveTechDiscountsRequest,
  DoveTechDiscountsSettings,
  ShippingObject,
} from '../types/dovetech.types';
import { SHIPPING_COST_NAME } from './dovetech-property-constants';
import { getLogger } from '../utils/logger.utils';
import { getCartAction, getCartCurrencyCode } from './cart-helpers';
import { CurrencyValue } from './currency-value';
import { CurrencyValueType } from '../types/index.types';
import type { Configuration } from '../types/index.types';
import { merge } from 'object-mapper';
import ServiceError from '../errors/service.error';

export default (
  commerceToolsCart: CartOrOrder,
  defaultDataInstance: DoveTechDiscountsDataInstance,
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

  const arrayOfCouponCodes: string[] =
    commerceToolsCart.custom?.fields[COUPON_CODES] ?? [];

  if (arrayOfCouponCodes.length > 0) {
    arrayOfCouponCodes.forEach((code: string) => {
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
    dataInstance:
      commerceToolsCart.custom?.fields[DATA_INSTANCE] ?? defaultDataInstance,
    commit: isOrder,
    explain: false,
  };

  const evaluationResultSummary = getEvaluationResultSummary(commerceToolsCart);

  if (isOrder && evaluationResultSummary?.currencyCode) {
    verifyEvaluatedCartCurrencyMatchesOrderCurrency(
      commerceToolsCart,
      evaluationResultSummary.currencyCode
    );
  }

  const dtRequest: DoveTechDiscountsRequest = {
    basket,
    costs,
    couponCodes,
    context,
    settings,
    expectedAggregateTotal: isOrder
      ? evaluationResultSummary?.aggregateTotal
      : undefined,
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
  order: CartOrOrder,
  evaluationCurrency: string
) => {
  const currentCurrencyCode = getCartCurrencyCode(order);

  if (evaluationCurrency !== currentCurrencyCode) {
    throw new ServiceError(
      400,
      'InvalidInput',
      `Currency code on the order (${currentCurrencyCode}) does not match the currency of the previous evaluation (${evaluationCurrency})`
    );
  }
};

const getEvaluationResultSummary = (commerceToolsCart: CartOrOrder) => {
  const serialisedEvaluationResultSummary =
    commerceToolsCart.custom?.fields[EVALUATION_RESULT_SUMMARY];

  if (!serialisedEvaluationResultSummary) {
    return undefined;
  }

  return JSON.parse(
    serialisedEvaluationResultSummary
  ) as EvaluationResultSummary;
};
