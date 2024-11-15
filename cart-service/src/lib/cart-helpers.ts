import { CartAction, CartOrOrder } from '../types/custom-commerce-tools.types';
import { CART_ACTION } from './cart-constants';

export const getCartAction = (
  cartOrOrder: CartOrOrder
): CartAction | undefined => {
  const serialisedCartAction = cartOrOrder.custom?.fields[CART_ACTION];
  return serialisedCartAction ? JSON.parse(serialisedCartAction) : undefined;
};

export const getCartCurrencyCode = (cartOrOrder: CartOrOrder): string => {
  return cartOrOrder.totalPrice.currencyCode;
};
