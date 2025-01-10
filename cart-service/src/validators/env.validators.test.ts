import { it, expect } from '@jest/globals';
import envValidators from '../validators/env.validators';
import { Configuration } from '../types/index.types';
import { getValidateMessages } from './helpers.validators';

it('valid configuration should return no errors', () => {
  const validationErrors = validate();

  expect(validationErrors).toEqual([]);
});

it('invalid clientId should return error', () => {
  const validationErrors = validate({ clientId: 'invalidClientId' });

  expect(validationErrors).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        code: 'InvalidClientId',
      }),
    ])
  );
});

it('invalid clientSecret should return error', () => {
  const validationErrors = validate({ clientSecret: 'invalidClientSecret' });

  expect(validationErrors).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        code: 'InvalidClientSecret',
      }),
    ])
  );
});

it('invalid projectKey should return error', () => {
  const validationErrors = validate({ projectKey: '' });

  expect(validationErrors).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        code: 'InvalidProjectKey',
      }),
    ])
  );
});

it('invalid scope should return error', () => {
  const validationErrors = validate({ scope: '0' });

  expect(validationErrors).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        code: 'InvalidScope',
      }),
    ])
  );
});

it('invalid dovetechApiHost should return error', () => {
  const validationErrors = validate({ dovetechApiHost: 'invalidHost' });

  expect(validationErrors).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        code: 'InvalidDoveTechApiHost',
      }),
    ])
  );
});

it('invalid basicAuthPwdCurrent should return error', () => {
  const validationErrors = validate({ basicAuthPwdCurrent: '' });

  expect(validationErrors).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        code: 'InvalidBasicAuthPwdCurrent',
      }),
    ])
  );
});

it('invalid otlpExporterEndpoint should return error', () => {
  const validationErrors = validate({ otlpExporterEndpoint: 'invalidHost' });

  expect(validationErrors).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        code: 'InvalidOtlpExporterEndpoint',
      }),
    ])
  );
});

it('invalid otlpExporterEndpointApiKey should return error', () => {
  const validationErrors = validate({ otlpExporterEndpointApiKey: '0' });

  expect(validationErrors).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        code: 'InValidOtlpExporterHostApiKey',
      }),
    ])
  );
});

const validate = (overrides?: object) => {
  const envVars: Configuration = {
    clientId: '012345678901234567890123', // 24 characters
    clientSecret: '01234567890123456789012345678901', // 32 characters
    projectKey: 'projectKey',
    scopes: 'scopes',
    region: 'region',
    dovetechApiHost: 'https://example.com',
    dovetechApiKey: 'api-key',
    basicAuthPwdCurrent: 'password',
    ...overrides,
  };

  return getValidateMessages(envValidators, envVars);
};
