import Decimal from 'decimal.js';
import { CurrencyValueType } from '../types/index.types';

export class CurrencyValue {
  private readonly amount: number;
  private readonly fractionDigits: number;
  private readonly type: CurrencyValueType;

  constructor(amount: number, fractionDigits: number, type: CurrencyValueType) {
    this.amount = amount;
    this.fractionDigits = fractionDigits;
    this.type = type;
  }

  toCurrencyUnits(): number {
    if (this.type === CurrencyValueType.MinorUnits) {
      return new Decimal(this.amount)
        .div(new Decimal(10).pow(this.fractionDigits))
        .toNumber();
    }
    return this.amount;
  }

  toMinorUnits(): number {
    if (this.type === CurrencyValueType.CurrencyUnits) {
      return new Decimal(this.amount)
        .mul(new Decimal(10).pow(this.fractionDigits))
        .toNumber();
    }
    return this.amount;
  }
}
