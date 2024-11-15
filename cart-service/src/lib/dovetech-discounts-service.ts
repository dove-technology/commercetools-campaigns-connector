import { Configuration } from '../types/index.types';
import {
  DoveTechDiscountsRequest,
  DoveTechDiscountsResponse,
} from '../types/dovetech.types';
import CustomError from '../errors/custom.error';
import AggregateTotalMismatchError from '../errors/aggregate-total-mismatch.error';
import { getLogger } from '../utils/logger.utils';

export const evaluate = async (
  configuration: Configuration,
  request: DoveTechDiscountsRequest
): Promise<DoveTechDiscountsResponse> => {
  const response = await fetch(`${configuration.dovetechApiHost}/evaluate`, {
    method: 'POST',
    headers: {
      'x-api-key': configuration.dovetechApiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    if (response.status === 400) {
      const problemDetails = await response.json();

      if (
        problemDetails.type ===
        'https://dovetech.com/problem-responses/aggregate-total-mismatch'
      ) {
        throw new AggregateTotalMismatchError();
      }

      const logger = getLogger();
      logger.error('Bad request returned from DoveTech discounts service', {
        meta: problemDetails,
      });
    }

    throw new CustomError(
      response.status,
      'Error while calling DoveTech discounts service.'
    );
  }

  return await response.json();
};
