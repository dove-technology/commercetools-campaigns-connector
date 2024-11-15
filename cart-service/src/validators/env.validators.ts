import {
  standardString,
  standardKey,
  standardUrl,
  optional,
} from './helpers.validators';

const envValidators = [
  standardString(
    ['clientId'],
    {
      code: 'InvalidClientId',
      message: 'Client id should be 24 characters.',
      referencedBy: 'environmentVariables',
    },
    { min: 24, max: 24 }
  ),

  standardString(
    ['clientSecret'],
    {
      code: 'InvalidClientSecret',
      message: 'Client secret should be 32 characters.',
      referencedBy: 'environmentVariables',
    },
    { min: 32, max: 32 }
  ),

  standardKey(['projectKey'], {
    code: 'InvalidProjectKey',
    message: 'Project key should be a valid string.',
    referencedBy: 'environmentVariables',
  }),

  optional(standardString)(
    ['scope'],
    {
      code: 'InvalidScope',
      message: 'Scope should be at least 2 characters long.',
      referencedBy: 'environmentVariables',
    },
    { min: 2, max: undefined }
  ),

  standardUrl(['dovetechApiHost'], {
    code: 'InvalidDoveTechApiHost',
    message: 'Dovetech API Host is not a valid URL.',
    referencedBy: 'environmentVariables',
  }),
];

export default envValidators;
