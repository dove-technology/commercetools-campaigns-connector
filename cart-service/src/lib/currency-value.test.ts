import { CurrencyValue } from './currency-value';
import { CurrencyValueType } from '../types/index.types';

it.each([
  [1099, 2, 10.99],
  [1000, 0, 1000],
  [1099, 3, 1.099],
])(
  'should convert minor units to currency units correctly with %p minor units and %p fractional digits',
  (minorUnits, fractionalDigits, expectedCurrencyUnits) => {
    const money = new CurrencyValue(
      minorUnits,
      fractionalDigits,
      CurrencyValueType.MinorUnits
    );
    expect(money.toCurrencyUnits()).toBe(expectedCurrencyUnits);
  }
);

it.each([
  [10.99, 2, 1099],
  [1000, 0, 1000],
  [1.099, 3, 1099],
])(
  'should convert currency units to minor units correctly with %p currency units and %p fractional digits',
  (currencyUnits, fractionalDigits, expectedMinorUnits) => {
    const money = new CurrencyValue(
      currencyUnits,
      fractionalDigits,
      CurrencyValueType.CurrencyUnits
    );
    expect(money.toMinorUnits()).toBe(expectedMinorUnits);
  }
);

it('should return the same amount if type is CurrencyUnit', () => {
  const money = new CurrencyValue(10, 2, CurrencyValueType.CurrencyUnits);
  expect(money.toCurrencyUnits()).toBe(10);
});

it('should return the same amount if type is MinorUnit', () => {
  const money = new CurrencyValue(1000, 2, CurrencyValueType.MinorUnits);
  expect(money.toMinorUnits()).toBe(1000);
});
