import map from './commerce-tools-cart-mapper';
import { DoveTechDiscountsDataInstance } from '../types/dovetech.types';
import { evaluate } from './dovetech-discounts-service';
import responseMapper from './dovetech-response-mapper';
import { ExtensionResponse } from '../types/index.types';
import { Configuration } from '../types/index.types';
import type { CartOrOrder } from '../types/custom-commerce-tools.types';
import { getLogger } from '../utils/logger.utils';

export const proxy = async (
  configuration: Configuration,
  commerceToolsCart: CartOrOrder
): Promise<ExtensionResponse> => {
  const logger = getLogger();

  logger.verbose('commercetools Cart:', { meta: commerceToolsCart });

  const doveTechRequest = map(
    commerceToolsCart,
    DoveTechDiscountsDataInstance.Live,
    configuration
  );

  logger.verbose('Dovetech Request:', { meta: doveTechRequest });

  const dovetechResponse = await evaluate(configuration, doveTechRequest);

  logger.verbose('Dovetech Response:', { meta: dovetechResponse });

  const response = responseMapper(dovetechResponse, commerceToolsCart);

  logger.verbose('Proxy Response:', { meta: response });

  return response;
};
