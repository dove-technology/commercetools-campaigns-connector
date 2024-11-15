import type { Cart, Order } from '@commercetools/platform-sdk';

export interface CouponCode {
  code: string;
}

export enum CartActionType {
  AddCouponCode = 'addCouponCode',
}

export interface CartAction {
  type: CartActionType;
}

export interface AddCouponCodeCartAction extends CartAction {
  type: CartActionType.AddCouponCode;
  code: string;
}

interface CustomCart extends Cart {
  type: 'Cart';
}

interface CustomOrder extends Order {
  type: 'Order';
}

export type CartOrOrder = CustomCart | CustomOrder;
