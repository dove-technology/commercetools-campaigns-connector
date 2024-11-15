export interface DoveTechDiscountsRequest {
  basket: DoveTechDiscountsBasket;
  costs: DoveTechDiscountsCost[] | undefined | null;
  couponCodes: DoveTechDiscountsCouponCode[] | undefined | null;
  context: DoveTechDiscountsContext | undefined | null;
  settings: DoveTechDiscountsSettings;
  expectedAggregateTotal: number | undefined;
  [key: string]: any; //eslint-disable-line -- these are additional properties that can be passed through to the DoveTech API
}

export interface DoveTechDiscountsBasket {
  items: DoveTechDiscountsLineItem[];
  [key: string]: any; //eslint-disable-line -- these are additional properties that can be passed through to the DoveTech API
}

export interface DoveTechDiscountsLineItem {
  quantity: number;
  price: number;
  [key: string]: any; //eslint-disable-line -- these are additional properties that can be passed through to the DoveTech API
}

export interface DoveTechDiscountsCost {
  name: string;
  value: number;
}

export interface DoveTechDiscountsCouponCode {
  code: string;
}

export interface DoveTechDiscountsContext {
  currencyCode: string;
  [key: string]: any; //eslint-disable-line -- these are additional properties that can be passed through to the DoveTech API
}

export interface DoveTechDiscountsSettings {
  dataInstance: DoveTechDiscountsDataInstance;
  commit: boolean;
  explain: boolean;
}

export enum DoveTechDiscountsDataInstance {
  Live = 'Live',
  Staging = 'Staging',
}

export type DoveTechAction =
  | AmountOffAction
  | CouponCodeAcceptedAction
  | CouponCodeRejectedAction;

export interface DoveTechDiscountsResponse {
  actions: DoveTechAction[];
  basket: DoveTechDiscountsResponseBasket | null;
  commitId: string | null;
  aggregates: DoveTechDiscountsAggregates;
  costs: DoveTechDiscountsResponseCost[];
}

export interface DoveTechDiscountsResponseBasket {
  total: number;
  totalAmountOff: number;
  items: DoveTechDiscountsResponseLineItem[];
}

export interface DoveTechDiscountsResponseLineItem {
  total: number;
  totalAmountOff: number;
  actions: DoveTechDiscountsResponseLineItemAction[];
}

export interface DoveTechDiscountsResponseLineItemAction {
  id: string;
  subItemId: number;
  amountOff: number;
}

export interface DoveTechDiscountsResponseAction {
  type: string;
  id: string;
}

export interface DoveTechDiscountsAggregates {
  total: number;
  totalAmountOff: number;
}

export interface DoveTechDiscountsResponseCost {
  name: string;
  value: number;
  totalAmountOff: number;
  // actions: DoveTechDiscountsResponseAction[];
}

export interface AmountOffAction {
  id: string;
  discountId: string;
  type: DoveTechActionType;
  qualifiedCouponCode?: string;
  amountOffType: AmountOffType;
  value: number;
  amountOff: number;
}

export interface CouponCodeAcceptedAction {
  type: DoveTechActionType.CouponCodeAccepted;
  id: string;
  code: string;
}

export interface CouponCodeRejectedAction {
  type: DoveTechActionType.CouponCodeRejected;
  id: string;
  code: string;
  reason: CouponCodeValidationError;
}

export enum DoveTechActionType {
  CouponCodeAccepted = 'CouponCodeAccepted',
  CouponCodeRejected = 'CouponCodeRejected',
  AmountOffLineItem = 'AmountOffLineItem',
  AmountOffBasket = 'AmountOffBasket',
  AmountOffCost = 'AmountOffCost',
  Content = 'Content',
  AccrueLoyaltyPoints = 'AccrueLoyaltyPoints',
  RedeemLoyaltyPoints = 'RedeemLoyaltyPoints',
}

export enum CouponCodeValidationError {
  NotRecognised = 'NotRecognised',
  IncorrectUser = 'IncorrectUser',
  UserRequired = 'UserRequired',
  NotStarted = 'NotStarted',
  Expired = 'Expired',
  UsageLimitReached = 'UsageLimitReached',
}

export enum AmountOffType {
  PercentOff = 'PercentOff',
  AmountOff = 'AmountOff',
  FixedPrice = 'FixedPrice',
}

export interface ShippingObject {
  methodId?: string;
}
