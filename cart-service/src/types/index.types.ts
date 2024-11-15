import { CartUpdateAction, ErrorResponse } from '@commercetools/platform-sdk';

export type ExtensionResponse =
  | {
      success: true;
      actions: CartUpdateAction[];
    }
  | {
      success: false;
      errorResponse: ErrorResponse;
    };

export type Message = {
  code: string;
  message: string;
  referencedBy: string;
};

export type ValidatorCreator = (
  path: string[],
  message: Message,
  overrideConfig?: object
) => [string[], [[(o: object) => boolean, string, [object]]]];

export type ValidatorFunction = (o: object) => boolean;

export type Wrapper = (
  validator: ValidatorFunction
) => (value: object) => boolean;

export interface Configuration {
  clientId: string;
  clientSecret: string;
  projectKey: string;
  scopes: string;
  region: string;
  dovetechApiHost: string;
  dovetechApiKey: string;
  mappingConfiguration?: object;
}

export enum CurrencyValueType {
  MinorUnits = 'MinorUnits',
  CurrencyUnits = 'CurrencyUnits',
}
