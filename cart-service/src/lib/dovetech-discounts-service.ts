import { Configuration } from '../types/index.types';
import {
  DoveTechDiscountsRequest,
  DoveTechDiscountsResponse,
} from '../types/dovetech.types';
import CustomError from '../errors/custom.error';
import { getLogger } from '../utils/logger.utils';
import { retryAsync } from 'ts-retry';

export const evaluate = async (
  configuration: Configuration,
  request: DoveTechDiscountsRequest
): Promise<DoveTechDiscountsResponse> => {
  const response = await retryAsync(
    async () => {
      const response = await callService(configuration, request);

      // error we can retry
      if (!response.ok && response.status !== 400) {
        throw new CustomError(
          response.status,
          'Error while calling DoveTech discounts service.'
        );
      }

      return response;
    },
    {
      delay: 100,
      maxTry: 2,
    }
  );

  if (response.status === 400) {
    const problemDetails = await response.json();

    if (
      problemDetails.type ===
      'https://dovetech.com/problem-responses/aggregate-total-mismatch'
    ) {
      throw new CustomError(
        400,
        'Expected aggregate total does not match latest aggregate total'
      );
    }

    const logger = getLogger();
    logger.error('Bad request returned from DoveTech discounts service', {
      meta: problemDetails,
    });
  }

  return await response.json();
};

const callService = async (
  configuration: Configuration,
  request: DoveTechDiscountsRequest
): Promise<Response> => {
  return await fetch(`${configuration.dovetechApiHost}/evaluate`, {
    method: 'POST',
    headers: {
      'x-api-key': configuration.dovetechApiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });
};
