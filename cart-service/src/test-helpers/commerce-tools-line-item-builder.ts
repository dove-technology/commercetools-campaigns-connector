import type {
  LineItem,
  LocalizedString,
  DiscountedPrice,
} from '@commercetools/platform-sdk';
import crypto from 'crypto';

export default class CommerceToolsLineItemBuilder {
  private id: string = crypto.randomUUID();
  private productId: string = crypto.randomUUID();
  private productKey = 'product1';
  private quantity = 1;
  private name: LocalizedString = { en: 'Product 1' };
  private productSlug: LocalizedString = { en: 'product-1' };
  private sku: string = crypto.randomUUID();
  private discountedPrice?: DiscountedPrice;

  constructor(
    private readonly centAmount: number,
    private readonly currencyCode: string,
    private readonly fractionDigits: number = 2
  ) {}

  setId(id: string): this {
    this.id = id;
    return this;
  }

  setProductId(productId: string): this {
    this.productId = productId;
    return this;
  }

  setProductKey(productKey: string): this {
    this.productKey = productKey;
    return this;
  }

  setQuantity(quantity: number): this {
    this.quantity = quantity;
    return this;
  }

  setName(name: LocalizedString): this {
    this.name = name;
    return this;
  }

  setProductSlug(productSlug: LocalizedString): this {
    this.productSlug = productSlug;
    return this;
  }

  setSku(sku: string): this {
    this.sku = sku;
    return this;
  }

  setDiscountedPrice(centAmount: number): this {
    this.discountedPrice = {
      value: {
        centAmount,
        currencyCode: this.currencyCode,
        fractionDigits: this.fractionDigits,
        type: 'centPrecision',
      },
      discount: {
        typeId: 'product-discount',
        id: 'aa979407-045c-4ba1-8460-9e44c38d8d8d',
      },
    };
    return this;
  }

  build(): LineItem {
    return {
      id: this.id,
      productId: this.productId,
      productKey: this.productKey,
      quantity: this.quantity,
      name: this.name,
      productSlug: this.productSlug,
      variant: {
        id: 1,
        sku: this.sku,
      },
      productType: {
        typeId: 'product-type',
        id: crypto.randomUUID(),
      },
      price: {
        id: crypto.randomUUID(),
        value: {
          centAmount: this.centAmount,
          currencyCode: this.currencyCode,
          fractionDigits: this.fractionDigits,
          type: 'centPrecision',
        },
        discounted: this.discountedPrice,
      },
      totalPrice: {
        centAmount: this.centAmount * this.quantity,
        currencyCode: this.currencyCode,
        fractionDigits: this.fractionDigits,
        type: 'centPrecision',
      },
      taxedPricePortions: [],
      discountedPricePerQuantity: [],
      state: [
        {
          quantity: 1,
          state: {
            typeId: 'state',
            id: '4dc9254c-63f1-438d-933a-3390f58e7451',
          },
        },
      ],
      perMethodTaxRate: [],
      priceMode: 'Platform',
      lineItemMode: 'Standard',
    };
  }
}
