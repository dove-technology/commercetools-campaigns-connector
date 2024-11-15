import type {
  Address,
  FieldContainer,
  LineItem,
} from '@commercetools/platform-sdk';
import crypto from 'crypto';
import type {
  CartAction,
  CartOrOrder,
  CouponCode,
} from '../types/custom-commerce-tools.types';
import {
  CART_ACTION,
  COUPON_CODES,
  EVALUATION_CURRENCY,
  EVALUATION_RESPONSE,
} from '../lib/cart-constants';
import { DoveTechDiscountsResponse } from '../types/dovetech.types';

export default class CommerceToolsCartBuilder {
  private lineItems: LineItem[] = [];
  private couponCodes: CouponCode[] = [];
  private cartAction?: CartAction;
  private type: 'Cart' | 'Order' = 'Cart';
  private customerId: string | undefined = undefined;
  private evaluationResponse: string | undefined = undefined;
  private evaluationCurrency: string | undefined = undefined;
  private billingAddress: Address | undefined = undefined;
  private shippingAddress: Address | undefined = undefined;

  constructor(
    private readonly currencyCode: string,
    private readonly fractionDigits: number = 2
  ) {}

  addLineItem(lineItem: LineItem): this {
    if (lineItem.price.value.currencyCode !== this.currencyCode) {
      throw new Error(
        `Currency code of line item price ${lineItem.price.value.currencyCode} does not match the currency code of the cart ${this.currencyCode}`
      );
    }

    if (lineItem.price.value.fractionDigits !== this.fractionDigits) {
      throw new Error(
        `Fraction digits of line item price ${lineItem.price.value.fractionDigits} does not match the fraction digits of the cart ${this.fractionDigits}`
      );
    }

    this.lineItems.push(lineItem);
    return this;
  }

  addCouponCode(couponCode: CouponCode): this {
    this.couponCodes.push(couponCode);
    return this;
  }

  addCartAction(cartAction: CartAction): this {
    this.cartAction = cartAction;
    return this;
  }

  setType(type: 'Cart' | 'Order'): this {
    this.type = type;
    return this;
  }

  setCustomerId(customerId: string): this {
    this.customerId = customerId;
    return this;
  }

  setEvaluationResponse(evaluationResponse: DoveTechDiscountsResponse): this {
    this.evaluationResponse = JSON.stringify(evaluationResponse);
    return this;
  }

  setEvaluationCurrency(evaluationCurrency: string): this {
    this.evaluationCurrency = evaluationCurrency;
    return this;
  }

  setBillingAddress(billingAddress: Address): this {
    this.billingAddress = billingAddress;
    return this;
  }

  setShippingAddress(shippingAddress: Address): this {
    this.shippingAddress = shippingAddress;
    return this;
  }

  build(): CartOrOrder {
    const customFields: FieldContainer = {
      [COUPON_CODES]: JSON.stringify(this.couponCodes),
      [CART_ACTION]: JSON.stringify(this.cartAction),
    };

    if (this.evaluationResponse) {
      customFields[EVALUATION_RESPONSE] = JSON.stringify(
        this.evaluationResponse
      );
    }

    if (this.evaluationCurrency) {
      customFields[EVALUATION_CURRENCY] = this.evaluationCurrency;
    }

    return {
      type: this.type,
      id: crypto.randomUUID(),
      version: 1,
      totalPrice: {
        currencyCode: this.currencyCode,
        centAmount: this.lineItems.reduce(
          (acc, lineItem) =>
            acc + lineItem.price.value.centAmount * lineItem.quantity,
          0
        ),
        fractionDigits: this.fractionDigits,
        type: 'centPrecision',
      },
      lineItems: this.lineItems,
      custom: {
        type: { typeId: 'type', id: crypto.randomUUID() },
        fields: customFields,
      },
      customerId: this.customerId,
      customLineItems: [],
      cartState: 'Active',
      taxMode: 'Platform',
      taxRoundingMode: 'HalfEven',
      taxCalculationMode: 'LineItemLevel',
      inventoryMode: 'None',
      shippingMode: 'Single',
      shipping: [],
      discountCodes: [],
      directDiscounts: [],
      itemShippingAddresses: [],
      refusedGifts: [],
      origin: 'Customer',
      createdAt: '2024-10-09T08:33:10.060Z',
      lastModifiedAt: '2024-10-09T08:33:10.060Z',
      shippingAddress: this.shippingAddress,
      billingAddress: this.billingAddress,
    } as CartOrOrder;
  }
}
