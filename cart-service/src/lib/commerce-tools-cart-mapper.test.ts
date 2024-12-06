import { test, expect } from '@jest/globals';
import cartMapper from './commerce-tools-cart-mapper';
import { DoveTechDiscountsDataInstance } from '../types/dovetech.types';
import CommerceToolsCartBuilder from '../test-helpers/commerce-tools-cart-builder';
import CommerceToolsLineItemBuilder from '../test-helpers/commerce-tools-line-item-builder';
import {
  AddCouponCodeCartAction,
  CartActionType,
  CartOrOrder,
} from '../types/custom-commerce-tools.types';
import * as cartUsingStagingDataInstance from '../test-helpers/cart-using-staging-data-instance.json';
import * as cartWithSingleShippingModeDiscounted from '../test-helpers/cart-with-single-shipping-mode-discounted.json';
import * as cartWithMultipleShippingMode from '../test-helpers/cart-with-multiple-shipping-mode.json';
import * as cartWithLineItemDirectDiscounts from '../test-helpers/cart-with-line-item-direct-discounts.json';
import * as orderWithEvaluationResult from '../test-helpers/order-with-evaluation-result.json';
import * as cartWithCustomer from '../test-helpers/cart-with-customer.json';
import * as cartWithSingleLineItem from '../test-helpers/cart-with-single-line-item.json';
import { getConfig } from '../test-helpers/test-config-helper';
import { SHIPPING_COST_NAME } from './dovetech-property-constants';
import AggregateTotalMismatchError from '../errors/aggregate-total-mismatch.error';
import { Configuration } from '../types/index.types';

jest.mock('../utils/config.utils');

test('single line item mapped correctly', async () => {
  const ctCart = cartWithSingleLineItem as CartOrOrder;

  const result = map(ctCart);

  expect(result.basket.items).toHaveLength(1);
  const mappedLineItem = result.basket.items[0];
  expect(mappedLineItem.quantity).toBe(2);
  expect(mappedLineItem.price).toBe(14.99);
  expect(mappedLineItem.hasProductDiscount).toBe(false);
  expect(mappedLineItem.productId).toBe('ee80b4e3-b653-4a9e-b55c-c5d4d687f3f2');
  expect(mappedLineItem.productKey).toBe('patterned-pillow-cover');
  expect(mappedLineItem.productTypeId).toBe(
    'e04b1724-013c-4d6c-8f53-7a8807fdbe3a'
  );
  expect(mappedLineItem.variant.key).toBe('ADPC-09-KEY');
  expect(mappedLineItem.variant.sku).toBe('ADPC-09');

  expect(result.context?.currencyCode).toBe('EUR');
  expect(result.settings.commit).toBe(false);
});

// this test covers a line item with a commercetools product discount
test('line item with discounted price mapped correctly', async () => {
  const currencyCode = 'USD';
  const originalLineItemCentAmount = 5000;

  const lineItem = new CommerceToolsLineItemBuilder(
    originalLineItemCentAmount,
    currencyCode
  )
    .setDiscountedPrice(4000)
    .setQuantity(2)
    .build();

  const ctCart = new CommerceToolsCartBuilder(currencyCode)
    .addLineItem(lineItem)
    .build();

  const result = map(ctCart);

  expect(result.basket.items).toHaveLength(1);
  expect(result.basket.items[0].quantity).toBe(2);
  expect(result.basket.items[0].price).toBe(40);
  expect(result.basket.items[0].hasProductDiscount).toBe(true);
  expect(result.context?.currencyCode).toBe(currencyCode);
  expect(result.settings.commit).toBe(false);
});

test('empty cart mapped correctly', async () => {
  const currencyCode = 'USD';

  const ctCart = new CommerceToolsCartBuilder(currencyCode).build();

  const result = map(ctCart);

  expect(result.basket.items).toHaveLength(0);
  expect(result.context?.currencyCode).toBe(currencyCode);
  expect(result.settings.commit).toBe(false);
});

// need to make sure we don't map discounted price caused by direct discounts
// because this will be from our discounts that have previously applied
test('cart with direct discounts maps non discounted price', async () => {
  const ctCart = cartWithLineItemDirectDiscounts as CartOrOrder;

  const result = map(ctCart);

  expect(result.basket.items).toHaveLength(1);
  expect(result.basket.items[0].price).toBe(52.99);
  expect(result.basket.items[0].quantity).toBe(1);
});

test('new coupon code mapped correctly', async () => {
  const currencyCode = 'USD';

  const addCouponCodeAction: AddCouponCodeCartAction = {
    type: CartActionType.AddCouponCode,
    code: 'TEST_COUPON',
  };
  const ctCart = new CommerceToolsCartBuilder(currencyCode)
    .addCartAction(addCouponCodeAction)
    .build();

  const result = map(ctCart);

  expect(result.couponCodes).toHaveLength(1);
  expect(result.couponCodes![0].code).toBe('TEST_COUPON');
});

test('existing coupon codes mapped correctly', async () => {
  const currencyCode = 'USD';

  const addCouponCodeAction: AddCouponCodeCartAction = {
    type: CartActionType.AddCouponCode,
    code: 'NEW_COUPON',
  };
  const ctCart = new CommerceToolsCartBuilder(currencyCode)
    .addCartAction(addCouponCodeAction)
    .addCouponCode('EXISTING_COUPON')
    .build();

  const result = map(ctCart);

  expect(result.couponCodes).toHaveLength(2);
  expect(result.couponCodes).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ code: 'NEW_COUPON' }),
      expect.objectContaining({ code: 'EXISTING_COUPON' }),
    ])
  );
});

test.each([
  ['USD', 2, 5097, 50.97],
  ['JPY', 0, 5097, 5097],
  ['KWD', 3, 5000, 5],
])(
  'line item with price with %s currency and %d fractional digits mapped correctly',
  async (
    currencyCode,
    fractionDigits,
    originalLineItemCentAmount,
    expectedPrice
  ) => {
    const lineItem = new CommerceToolsLineItemBuilder(
      originalLineItemCentAmount,
      currencyCode,
      fractionDigits
    ).build();

    const ctCart = new CommerceToolsCartBuilder(currencyCode, fractionDigits)
      .addLineItem(lineItem)
      .build();

    const result = map(ctCart);

    expect(result.basket.items).toHaveLength(1);
    expect(result.basket.items[0].price).toBe(expectedPrice);
    expect(result.context?.currencyCode).toBe(currencyCode);
  }
);

test('should map customer object when cart has a customer', async () => {
  const ctCart = cartWithCustomer as CartOrOrder;

  const result = map(ctCart);

  expect(result.customer).toMatchObject({
    id: '475aaa5e-e4c7-4945-866f-56a184e6ef2b',
    email: 'test@example.com',
    groupId: '2a447f5d-7d08-4930-82b6-769baf8874a8',
  });
});

test('should map customer object when cart has partial customer info', async () => {
  const customerId = '475aaa5e-e4c7-4945-866f-56a184e6ef2b';
  const ctCart = new CommerceToolsCartBuilder('EUR', 2)
    .setCustomerId(customerId)
    .build();

  const result = map(ctCart);

  expect(result.customer).toMatchObject({
    id: customerId,
  });
});

test('should set commit and expectedAggregateTotal when type is Order', async () => {
  const ctCart = orderWithEvaluationResult as CartOrOrder;

  const result = map(ctCart);

  expect(result.settings.commit).toBe(true);
  expect(result.expectedAggregateTotal).toBe(22.97);
});

test('should throw error if evaluation result currency is different and type is Order', async () => {
  const currencyCode = 'USD';

  const lineItem = new CommerceToolsLineItemBuilder(5000, currencyCode).build();

  const ctCart = new CommerceToolsCartBuilder(currencyCode)
    .addLineItem(lineItem)
    .setEvaluationCurrency('EUR')
    .setType('Order')
    .build();

  expect(() => map(ctCart)).toThrow(AggregateTotalMismatchError);
});

test('should map if evaluation result currency is different when type is Cart', async () => {
  const currencyCode = 'USD';

  const lineItem = new CommerceToolsLineItemBuilder(5000, currencyCode).build();

  const ctCart = new CommerceToolsCartBuilder(currencyCode)
    .addLineItem(lineItem)
    .setEvaluationCurrency('EUR')
    .build();

  const result = map(ctCart);

  expect(result.expectedAggregateTotal).toBe(undefined);
});

test('should map non-discounted shipping price', async () => {
  const ctCart = cartWithSingleShippingModeDiscounted as CartOrOrder;

  const result = map(ctCart);

  expect(result.costs).toHaveLength(1);
  expect(result.costs![0].name).toBe(SHIPPING_COST_NAME);
  expect(result.costs![0].value).toBe(100);
});

// multiple shipping mode not supported at present
test('should not map shipping info when cart shipping mode is multiple', async () => {
  const ctCart = cartWithMultipleShippingMode as CartOrOrder;

  const result = map(ctCart);

  expect(result.costs).toHaveLength(0);
});

test('should map addresses', async () => {
  const currencyCode = 'USD';

  const ctCart = new CommerceToolsCartBuilder(currencyCode)
    .setBillingAddress({
      country: 'US',
    })
    .setShippingAddress({
      country: 'GB',
    })
    .build();

  const result = map(ctCart);

  expect(result.billingAddress).toEqual(
    expect.objectContaining({ countryCode: 'US' })
  );

  expect(result.shippingAddress).toEqual(
    expect.objectContaining({ countryCode: 'GB' })
  );
});

test('should map fields based on mapping configuration', async () => {
  const ctCart = cartWithSingleLineItem as CartOrOrder;

  const serialisedMappingConfig =
    '{ "custom.fields.test-field": "context.test" }';

  const result = map(ctCart, {
    mappingConfiguration: buildMappingConfig(serialisedMappingConfig),
  });

  expect(result.context?.test).toBe('test-value');
});

test('can map line item data using mapping configuration', async () => {
  const ctCart = cartWithSingleLineItem as CartOrOrder;

  const serialisedMappingConfig =
    '{ "lineItems[].name.en-GB": "basket.items[].name" }';

  const result = map(ctCart, {
    mappingConfiguration: buildMappingConfig(serialisedMappingConfig),
  });

  expect(result.basket.items[0].name).toBe('Patterned Pillow Cover');
  expect(result.basket.items[0].quantity).toBe(2); // verify other properties are still mapped
});

test("should not error if mapping configuration has nested path that doesn't exist", async () => {
  const ctCart = cartWithSingleLineItem as CartOrOrder;

  const serialisedMappingConfig =
    '{ "custom.fields.does.not.exist": "context.test" }';

  const result = map(ctCart, {
    mappingConfiguration: buildMappingConfig(serialisedMappingConfig),
  });

  expect(result.context?.test).toBeUndefined();
});

test("should use data instance from cart if set", async () => {
  const ctCart = cartUsingStagingDataInstance as CartOrOrder;

  const result = map(ctCart);

  expect(result.settings.dataInstance).toBe(
    DoveTechDiscountsDataInstance.Staging
  );
});

const map = (ctCart: CartOrOrder, configOverrides?: Partial<Configuration>) => {
  return cartMapper(
    ctCart,
    DoveTechDiscountsDataInstance.Live,
    getConfig(configOverrides)
  );
};

const buildMappingConfig = (mappingConfig: string) => {
  // using JSON strings to verify that mapping from a string works
  return JSON.parse(mappingConfig);
};
