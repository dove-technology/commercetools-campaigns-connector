import { expect } from '@jest/globals';
import request from 'supertest';
import app from '../app';
import fetchMock from 'jest-fetch-mock';
import CommerceToolsCartBuilder from '../test-helpers/commerce-tools-cart-builder';
import { readConfiguration } from '../../src/utils/config.utils';
import DoveTechResponseBuilder from '../test-helpers/dovetech-response-builder';
import {
  AmountOffAction,
  CouponCodeAcceptedAction,
  DoveTechActionType,
} from '../types/dovetech.types';
import CommerceToolsLineItemBuilder from '../test-helpers/commerce-tools-line-item-builder';
import { CartSetDirectDiscountsAction } from '@commercetools/platform-sdk';
import {
  AddCouponCodeCartAction,
  CartActionType,
  CartOrOrder,
} from '../types/custom-commerce-tools.types';
import { buildAmountOffAction } from '../test-helpers/dovetech-action-builders';
import { SHIPPING_COST_NAME } from '../lib/dovetech-property-constants';
import * as cartWithSingleShippingModeDiscounted from '../test-helpers/cart-with-single-shipping-mode-discounted.json';
import * as orderWithEvaluationResult from '../test-helpers/order-with-evaluation-result.json';
import { buildSetCustomTypeAction } from '../test-helpers/commerce-tools-action-builders';

jest.mock('../../src/utils/config.utils');

beforeEach(() => {
  (readConfiguration as jest.Mock).mockClear();
  fetchMock.resetMocks();
});

test('should only return custom type action when Dovetech service returns no discounts', async () => {
  const currencyCode = 'USD';
  const dtResponse = new DoveTechResponseBuilder().build();
  fetchMock.mockResponseOnce(JSON.stringify(dtResponse));

  const ctCart = new CommerceToolsCartBuilder(currencyCode).build();

  const response = await postCart(ctCart);

  expect(response.status).toBe(200);
  expect(response.body).toEqual({
    actions: [buildSetCustomTypeAction(dtResponse, currencyCode, '[]')],
  });
});

test('should return set direct discount line item actions when Dovetech service returns discounted basket', async () => {
  const currencyCode = 'USD';
  const originalLineItemCentAmount = 4000;

  const amountOff = 2;
  const total = 38;

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

  fetchMock.mockResponseOnce(JSON.stringify(dtResponse));

  const response = await postCart(ctCart);

  expect(response.status).toBe(200);

  const expectedAction: CartSetDirectDiscountsAction = {
    action: 'setDirectDiscounts',
    discounts: [
      {
        value: {
          type: 'absolute',
          money: [
            {
              centAmount: 200,
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

  expect(response.body).toEqual({
    actions: [
      expectedAction,
      buildSetCustomTypeAction(dtResponse, currencyCode, '[]'),
    ],
  });
});

test('should return set direct discounts when Dovetech service returns discounted basket and cost', async () => {
  const currencyCode = 'EUR';
  const amountOffShippingInCurrencyUnits = 2.2;

  const ctCart = cartWithSingleShippingModeDiscounted as CartOrOrder;

  const amountOffBasketAction: AmountOffAction = buildAmountOffAction(
    DoveTechActionType.AmountOffBasket,
    2
  );

  const amountOffCostAction: AmountOffAction = buildAmountOffAction(
    DoveTechActionType.AmountOffCost,
    amountOffShippingInCurrencyUnits
  );

  // original line item price is 5299 cents EUR
  // original shipping cost is 10000 cents EUR

  const dtResponse = new DoveTechResponseBuilder()
    .addAction(amountOffBasketAction)
    .addAction(amountOffCostAction)
    .addLineItem({
      totalAmountOff: amountOffBasketAction.amountOff,
      total: 50.99,
      actions: [
        {
          id: amountOffBasketAction.id,
          subItemId: 0,
          amountOff: amountOffBasketAction.amountOff,
        },
      ],
    })
    .addCost({
      totalAmountOff: amountOffShippingInCurrencyUnits,
      name: SHIPPING_COST_NAME,
      value: 97.8,
    })
    .build();

  fetchMock.mockResponseOnce(JSON.stringify(dtResponse));

  const response = await postCart(ctCart);

  expect(response.status).toBe(200);

  const expectedAction: CartSetDirectDiscountsAction = {
    action: 'setDirectDiscounts',
    discounts: [
      {
        value: {
          type: 'absolute',
          money: [
            {
              centAmount: 200,
              currencyCode,
            },
          ],
        },
        target: {
          type: 'lineItems',
          predicate: `sku = "MLP-01"`,
        },
      },
      {
        value: {
          type: 'absolute',
          money: [
            {
              centAmount: 220,
              currencyCode,
            },
          ],
        },
        target: {
          type: 'shipping',
        },
      },
    ],
  };

  expect(response.body).toEqual({
    actions: [
      expectedAction,
      buildSetCustomTypeAction(dtResponse, currencyCode, '[]'),
    ],
  });
});

test('should return action to set coupon codes on cart when Dovetech service returns coupon code accepted action', async () => {
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

  fetchMock.mockResponseOnce(JSON.stringify(dtResponse));

  const response = await postCart(ctCart);

  expect(response.status).toBe(200);

  expect(response.body).toEqual({
    actions: [
      buildSetCustomTypeAction(
        dtResponse,
        currencyCode,
        '[{"code":"TEST_COUPON"}]'
      ),
    ],
  });
});

test('should return 403 if no basic auth is provided', async () => {
  const response = await request(app).post('/cart-service');
  expect(response.status).toBe(403);
  expect(response.body).toEqual({ message: 'Forbidden' });
});

test('should return 403 if incorrect basic auth is provided', async () => {
  const response = await request(app)
    .post('/cart-service')
    .set('Authorization', 'Basic 123');
  expect(response.status).toBe(403);
  expect(response.body).toEqual({ message: 'Forbidden' });
});

test('should return valid response if the correct basic auth is the current password', async () => {
  const basicAuthPassword = readConfiguration().basicAuthPwdCurrent;
  const response = await request(app)
    .post('/cart-service')
    .set(
      'Authorization',
      'Basic ' + Buffer.from(basicAuthPassword).toString('base64')
    );

  //expecting 400 because the request body is empty
  expect(response.status).toBe(400);
});

test('should return valid response if the correct basic auth is the previous password', async () => {
  const basicAuthPassword = readConfiguration().basicAuthPwdPrevious;
  const response = await request(app)
    .post('/cart-service')
    .set(
      'Authorization',
      'Basic ' + Buffer.from(basicAuthPassword).toString('base64')
    );

  //expecting 400 because the request body is empty
  expect(response.status).toBe(400);
});

test('should return 404 when non existing route', async () => {
  const response = await request(app).post('/does-not-exist');
  expect(response.status).toBe(404);
  expect(response.body).toEqual({
    message: 'Path not found.',
  });
});

test('should return 400 bad request when post invalid resource', async () => {
  const basicAuthPassword = readConfiguration().basicAuthPwdCurrent;
  const response = await request(app)
    .post('/cart-service')
    .set(
      'Authorization',
      'Basic ' + Buffer.from(basicAuthPassword).toString('base64')
    )
    .send({});

  expect(response.status).toBe(400);
  expect(response.body).toEqual({
    message: 'Bad request - Missing resource object.',
  });
});

test('should return empty actions when Dovetech service returns 400', async () => {
  const dtResponse = {
    type: 'https://httpstatuses.io/400',
    title: 'Bad Request',
    status: 400,
    detail:
      "A currency code of 'Invalid' doesn't match any currencies in the project",
  };

  fetchMock.mockResponseOnce(JSON.stringify(dtResponse), { status: 400 });

  const ctCart = new CommerceToolsCartBuilder('USD').build();

  const response = await postCart(ctCart);

  expect(response.status).toBe(200);
  expect(response.body).toEqual({
    actions: [],
  });
});

test('should return empty actions when Dovetech service returns 500', async () => {
  fetchMock.mockResponseOnce('', { status: 500 });

  const ctCart = new CommerceToolsCartBuilder('USD').build();

  const response = await postCart(ctCart);

  expect(response.status).toBe(200);
  expect(response.body).toEqual({
    actions: [],
  });
});

test('should return no actions when type is Order', async () => {
  const amountOff = 10;
  const total = 22.97;

  const ctCart = orderWithEvaluationResult as CartOrOrder;

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

  fetchMock.mockResponseOnce(JSON.stringify(dtResponse));

  const response = await postCart(ctCart);

  expect(response.status).toBe(200);

  expect(response.body).toEqual({
    actions: [],
  });
});

test('should reject order if aggregate-total-mismatch error returned', async () => {
  const currencyCode = 'USD';

  const lineItem = new CommerceToolsLineItemBuilder(4000, currencyCode).build();

  const ctCart = new CommerceToolsCartBuilder(currencyCode)
    .addLineItem(lineItem)
    .setType('Order')
    .build();

  const dtResponse = {
    type: 'https://dovetech.com/problem-responses/aggregate-total-mismatch',
    title: 'Expected aggregate total does not match latest aggregate total',
    status: 400,
  };

  fetchMock.mockResponseOnce(JSON.stringify(dtResponse), { status: 400 });

  const response = await postCart(ctCart);

  expect(response.status).toBe(400);

  expect(response.body).toEqual({
    errors: [
      {
        code: 'InvalidOperation',
        message:
          'Expected aggregate total does not match latest aggregate total',
      },
    ],
  });
});

const postCart = async (cartOrOrder: CartOrOrder) => {
  const basicAuthPassword = readConfiguration().basicAuthPwdCurrent;

  return await request(app)
    .post('/cart-service')
    .set(
      'Authorization',
      'Basic ' + Buffer.from(basicAuthPassword).toString('base64')
    )
    .send({
      resource: {
        obj: cartOrOrder,
      },
    });
};
