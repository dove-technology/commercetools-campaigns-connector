import { it, expect } from '@jest/globals';
import map from './dovetech-response-mapper';
import {
  AmountOffAction,
  CouponCodeAcceptedAction,
  CouponCodeRejectedAction,
  CouponCodeValidationError,
  DoveTechActionType,
} from '../types/dovetech.types';
import CommerceToolsCartBuilder from '../test-helpers/commerce-tools-cart-builder';
import CommerceToolsLineItemBuilder from '../test-helpers/commerce-tools-line-item-builder';
import DoveTechResponseBuilder from '../test-helpers/dovetech-response-builder';
import {
  AddCouponCodeCartAction,
  CartActionType,
  CartOrOrder,
} from '../types/custom-commerce-tools.types';
import { CartSetDirectDiscountsAction } from '@commercetools/platform-sdk';
import crypto from 'crypto';
import { buildAmountOffAction } from '../test-helpers/dovetech-action-builders';
import * as cartWithSingleShippingModeDiscounted from '../test-helpers/cart-with-single-shipping-mode-discounted.json';
import * as cartWithSingleShippingModeDirectDiscounts from '../test-helpers/cart-with-single-shipping-mode-direct-discounts.json';
import { SHIPPING_COST_NAME } from './dovetech-property-constants';
import { buildSetCustomTypeAction as buildSetCustomTypeAction } from '../test-helpers/commerce-tools-action-builders';

it('should return no actions if there are no line items or shipping methods', () => {
  const currencyCode = 'USD';
  const ctCart = new CommerceToolsCartBuilder(currencyCode).build();
  const dtResponse = new DoveTechResponseBuilder().build();

  const result = map(dtResponse, ctCart);

  expect(result).toEqual({
    success: true,
    actions: [buildSetCustomTypeAction(dtResponse, currencyCode, [])],
  });
});

it('should map DoveTech Amount off Basket apportioned line item amounts to line item direct discounts', () => {
  const currencyCode = 'USD';
  const originalLineItemCentAmount = 4000;

  // these amounts cause issues when multiplying in Vanilla JavaScript, so using them in the test here
  const amountOff = 2.2;
  const total = 37.8;

  const lineItem = new CommerceToolsLineItemBuilder(
    originalLineItemCentAmount,
    currencyCode
  ).build();

  const ctCart = new CommerceToolsCartBuilder(currencyCode)
    .addLineItem(lineItem)
    .build();

  const amountOffBasketAction: AmountOffAction = buildAmountOffAction(
    DoveTechActionType.AmountOffBasket,
    amountOff
  );

  const dtResponse = new DoveTechResponseBuilder()
    .addAction(amountOffBasketAction)
    .addLineItem({
      totalAmountOff: amountOffBasketAction.amountOff,
      total: total,
      actions: [
        {
          id: amountOffBasketAction.id,
          subItemId: 0,
          amountOff: amountOffBasketAction.amountOff,
        },
      ],
    })
    .build();

  const expectedAction: CartSetDirectDiscountsAction = {
    action: 'setDirectDiscounts',
    discounts: [
      {
        value: {
          type: 'absolute',
          money: [
            {
              centAmount: 220,
              currencyCode: 'USD',
            },
          ],
        },
        target: {
          type: 'lineItems',
          predicate: `sku = "${lineItem.variant.sku}"`,
        },
      },
    ],
  };

  const result = map(dtResponse, ctCart);

  expect(result).toEqual({
    success: true,
    actions: expect.arrayContaining([expectedAction]),
  });
});

it('should map DoveTech Amount off Line Item discounts to line item direct discounts', () => {
  const currencyCode = 'USD';

  const lineItem1 = new CommerceToolsLineItemBuilder(
    4000,
    currencyCode
  ).build();

  const lineItem2 = new CommerceToolsLineItemBuilder(
    3000,
    currencyCode
  ).build();

  const ctCart = new CommerceToolsCartBuilder(currencyCode)
    .addLineItem(lineItem1)
    .addLineItem(lineItem2)
    .build();

  const amountOffLineItem: AmountOffAction = buildAmountOffAction(
    DoveTechActionType.AmountOffLineItem,
    10
  );

  const dtResponse = new DoveTechResponseBuilder()
    .addAction(amountOffLineItem)
    .addLineItem({
      totalAmountOff: 0,
      total: 40,
      actions: [],
    })
    .addLineItem({
      totalAmountOff: amountOffLineItem.amountOff,
      total: 20,
      actions: [
        {
          id: amountOffLineItem.id,
          subItemId: 0,
          amountOff: amountOffLineItem.amountOff,
        },
      ],
    })
    .build();

  const expectedAction: CartSetDirectDiscountsAction = {
    action: 'setDirectDiscounts',
    discounts: [
      {
        value: {
          type: 'absolute',
          money: [
            {
              centAmount: 1000,
              currencyCode: 'USD',
            },
          ],
        },
        target: {
          type: 'lineItems',
          predicate: `sku = "${lineItem2.variant.sku}"`,
        },
      },
    ],
  };

  const result = map(dtResponse, ctCart);

  expect(result).toEqual({
    success: true,
    actions: expect.arrayContaining([expectedAction]),
  });
});

it.each([
  ['USD', 2, 4000, 2.2, 220, 37.8],
  ['JPY', 0, 400, 20, 20, 380],
  ['KWD', 3, 40999, 1.0, 1000, 30.999],
])(
  'currency amounts are mapped correctly for %s',
  (
    currencyCode,
    fractionDigits,
    originalLineItemCentAmount,
    amountOff,
    amountOffCentAmount,
    total
  ) => {
    const lineItem = new CommerceToolsLineItemBuilder(
      originalLineItemCentAmount,
      currencyCode,
      fractionDigits
    ).build();

    const ctCart = new CommerceToolsCartBuilder(currencyCode, fractionDigits)
      .addLineItem(lineItem)
      .build();

    const amountOffBasketAction: AmountOffAction = buildAmountOffAction(
      DoveTechActionType.AmountOffBasket,
      amountOff
    );

    const dtResponse = new DoveTechResponseBuilder()
      .addAction(amountOffBasketAction)
      .addLineItem({
        totalAmountOff: amountOffBasketAction.amountOff,
        total: total,
        actions: [
          {
            id: amountOffBasketAction.id,
            subItemId: 0,
            amountOff: amountOffBasketAction.amountOff,
          },
        ],
      })
      .build();

    const expectedAction: CartSetDirectDiscountsAction = {
      action: 'setDirectDiscounts',
      discounts: [
        {
          value: {
            type: 'absolute',
            money: [
              {
                centAmount: amountOffCentAmount,
                currencyCode: currencyCode,
              },
            ],
          },
          target: {
            type: 'lineItems',
            predicate: `sku = "${lineItem.variant.sku}"`,
          },
        },
      ],
    };

    const result = map(dtResponse, ctCart);

    expect(result).toEqual({
      success: true,
      actions: expect.arrayContaining([expectedAction]),
    });
  }
);

it('should return direct discounts correctly for multiple line items', () => {
  const currencyCode = 'EUR';

  const amountOff = 10;

  const lineItem1 = new CommerceToolsLineItemBuilder(1499, currencyCode)
    .setQuantity(2)
    .build();

  const lineItem2 = new CommerceToolsLineItemBuilder(
    5299,
    currencyCode
  ).build();

  const ctCart = new CommerceToolsCartBuilder(currencyCode)
    .addLineItem(lineItem1)
    .addLineItem(lineItem2)
    .build();

  const amountOffBasketAction: AmountOffAction = buildAmountOffAction(
    DoveTechActionType.AmountOffBasket,
    amountOff
  );

  const dtResponse = new DoveTechResponseBuilder()
    .addAction(amountOffBasketAction)
    .addLineItem({
      totalAmountOff: 3.62,
      total: 26.36,
      actions: [
        {
          id: amountOffBasketAction.id,
          subItemId: 1,
          amountOff: 1.82,
        },
        {
          id: amountOffBasketAction.id,
          subItemId: 2,
          amountOff: 1.8,
        },
      ],
    })
    .addLineItem({
      totalAmountOff: 6.38,
      total: 46.61,
      actions: [
        {
          id: amountOffBasketAction.id,
          subItemId: 1,
          amountOff: 6.38,
        },
      ],
    })
    .build();

  const expectedAction: CartSetDirectDiscountsAction = {
    action: 'setDirectDiscounts',
    discounts: [
      {
        value: {
          type: 'absolute',
          money: [
            {
              centAmount: 362,
              currencyCode: currencyCode,
            },
          ],
        },
        target: {
          type: 'lineItems',
          predicate: `sku = "${lineItem1.variant.sku}"`,
        },
      },
      {
        value: {
          type: 'absolute',
          money: [
            {
              centAmount: 638,
              currencyCode: currencyCode,
            },
          ],
        },
        target: {
          type: 'lineItems',
          predicate: `sku = "${lineItem2.variant.sku}"`,
        },
      },
    ],
  };

  const result = map(dtResponse, ctCart);

  expect(result).toEqual({
    success: true,
    actions: expect.arrayContaining([expectedAction]),
  });
});

// if no discounts returned from Dovetech, but there are direct discounts on the cart, we need to clear them as they will be previous discounts we've set
it('should return empty direct discounts action if cart has direct discounts and no discounts returned', () => {
  const ctCart = cartWithSingleShippingModeDirectDiscounts as CartOrOrder;

  const dtResponse = new DoveTechResponseBuilder()
    .addLineItem({
      totalAmountOff: 0,
      total: 52.99,
      actions: [],
    })
    .build();

  const result = map(dtResponse, ctCart);

  const expectedAction: CartSetDirectDiscountsAction = {
    action: 'setDirectDiscounts',
    discounts: [],
  };

  expect(result).toEqual({
    success: true,
    actions: expect.arrayContaining([expectedAction]),
  });
});

it('should map CouponCodeAccepted actions correctly', () => {
  const currencyCode = 'USD';
  const couponCode = 'TEST_COUPON';
  const addCouponCodeAction: AddCouponCodeCartAction = {
    type: CartActionType.AddCouponCode,
    code: couponCode,
  };

  const ctCart = new CommerceToolsCartBuilder(currencyCode)
    .addCartAction(addCouponCodeAction)
    .build();

  const couponCodeAcceptedAction: CouponCodeAcceptedAction = {
    type: DoveTechActionType.CouponCodeAccepted,
    id: crypto.randomUUID(),
    code: couponCode,
  };

  const dtResponse = new DoveTechResponseBuilder()
    .addAction(couponCodeAcceptedAction)
    .build();

  const result = map(dtResponse, ctCart);

  expect(result).toEqual({
    success: true,
    actions: [
      buildSetCustomTypeAction(dtResponse, currencyCode, ['TEST_COUPON']),
    ],
  });
});

it('CouponCodeRejected action for new coupon code should return error', () => {
  const couponCode = 'INVALID_COUPON';
  const addCouponCodeAction: AddCouponCodeCartAction = {
    type: CartActionType.AddCouponCode,
    code: couponCode,
  };

  const ctCart = new CommerceToolsCartBuilder('USD')
    .addCartAction(addCouponCodeAction)
    .build();

  const couponCodeRejectedAction: CouponCodeRejectedAction = {
    type: DoveTechActionType.CouponCodeRejected,
    id: crypto.randomUUID(),
    code: couponCode,
    reason: CouponCodeValidationError.NotRecognised,
  };

  const dtResponse = new DoveTechResponseBuilder()
    .addAction(couponCodeRejectedAction)
    .build();

  const result = map(dtResponse, ctCart);

  expect(result).toEqual({
    success: false,
    errorResponse: {
      statusCode: 400,
      message: 'Discount code is not applicable',
    },
  });
});

it('CouponCodeRejected action for existing coupon code should remove coupon code', () => {
  const currencyCode = 'USD';
  const existingCouponCode = 'EXISTING_COUPON';

  const ctCart = new CommerceToolsCartBuilder(currencyCode)
    .addCouponCode(existingCouponCode)
    .build();

  const couponCodeRejectedAction: CouponCodeRejectedAction = {
    type: DoveTechActionType.CouponCodeRejected,
    id: crypto.randomUUID(),
    code: existingCouponCode,
    reason: CouponCodeValidationError.NotRecognised,
  };

  const dtResponse = new DoveTechResponseBuilder()
    .addAction(couponCodeRejectedAction)
    .build();

  const result = map(dtResponse, ctCart);

  expect(result).toEqual({
    success: true,
    actions: [buildSetCustomTypeAction(dtResponse, currencyCode, [])],
  });
});

it('should return setCustomType action including commitId field if type is Order', () => {
  const currencyCode = 'USD';
  const originalLineItemCentAmount = 40000;

  const lineItem = new CommerceToolsLineItemBuilder(
    originalLineItemCentAmount,
    currencyCode
  ).build();

  const ctCart = new CommerceToolsCartBuilder(currencyCode)
    .addLineItem(lineItem)
    .setType('Order')
    .build();

  const dtResponse = new DoveTechResponseBuilder()
    .addCommitId('123')
    .addLineItem({
      totalAmountOff: 0,
      total: 30,
      actions: [],
    })
    .build();

  const result = map(dtResponse, ctCart);

  expect(result).toEqual({
    success: true,
    actions: [buildSetCustomTypeAction(dtResponse, currencyCode, [])],
  });
});

describe('shipping costs', () => {
  it('should return set direct discounts action if shipping cost returned', () => {
    const ctCart = cartWithSingleShippingModeDiscounted as CartOrOrder;

    const amountOffInCurrencyUnits = 2.2;

    // original shipping amount is 10000

    const amountOffCostAction: AmountOffAction = buildAmountOffAction(
      DoveTechActionType.AmountOffCost,
      amountOffInCurrencyUnits
    );

    const dtResponse = new DoveTechResponseBuilder()
      .addAction(amountOffCostAction)
      .addLineItem({
        totalAmountOff: 0,
        total: 52.99,
        actions: [],
      })
      .addCost({
        totalAmountOff: amountOffInCurrencyUnits,
        name: SHIPPING_COST_NAME,
        value: 97.8,
      })
      .build();

    const result = map(dtResponse, ctCart);

    const expectedAction: CartSetDirectDiscountsAction = {
      action: 'setDirectDiscounts',
      discounts: [
        {
          value: {
            type: 'absolute',
            money: [
              {
                centAmount: 220,
                currencyCode: 'EUR',
              },
            ],
          },
          target: {
            type: 'shipping',
          },
        },
      ],
    };

    expect(result).toEqual({
      success: true,
      actions: expect.arrayContaining([expectedAction]),
    });
  });

  it('should return no direct discounts action if cart has no direct discounts and no shipping cost returned', () => {
    const ctCart = cartWithSingleShippingModeDiscounted as CartOrOrder;

    const dtResponse = new DoveTechResponseBuilder()
      .addLineItem({
        totalAmountOff: 0,
        total: 52.99,
        actions: [],
      })
      .build();

    const result = map(dtResponse, ctCart);

    expect(result).toEqual({
      success: true,
      actions: [buildSetCustomTypeAction(dtResponse, 'EUR', [])],
    });
  });
});
