import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import CustomError from './errors/custom.error';
import { proxy } from './lib/commerce-tools-dovetech-proxy';
import { readConfiguration } from './utils/config.utils';
import { getLogger } from './utils/logger.utils';
import { CartOrOrder } from './types/custom-commerce-tools.types';
import winston from 'winston';

dotenv.config();

const configuration = readConfiguration();

const app = express();
app.disable('x-powered-by');
app.use(bodyParser.json());

app.post('/cart-service', async (req: Request, res: Response) => {
  let resourceObject: CartOrOrder | undefined;
  const logger = getLogger();

  try {
    //check if the request has a basic auth header
    if (!req.headers.authorization) {
      setErrorResponse(res, 403, 'Forbidden');
      return;
    }

    //check if the request header has the correct basic auth password and return 403 if it does not
    const currentBasicAuthPassword = configuration.basicAuthPwdCurrent;
    const previousBasicAuthPassword = configuration.basicAuthPwdPrevious;

    const authHeader = req.headers.authorization;
    const encodedPassword = authHeader.split(' ')[1];
    const decodedPassword = Buffer.from(encodedPassword, 'base64').toString(
      'utf-8'
    );

    if (
      decodedPassword !== currentBasicAuthPassword &&
      decodedPassword !== previousBasicAuthPassword
    ) {
      setErrorResponse(res, 403, 'Forbidden');
      return;
    }

    const { resource } = req.body;

    if (!resource?.obj) {
      setErrorResponse(res, 400, 'Bad request - Missing resource object.');
      return;
    }

    resourceObject = resource.obj as CartOrOrder;
  } catch (error) {
    logError(error, logger);

    setErrorResponse(res, 500, 'Internal Server Error');

    return;
  }

  try {
    const extensionResponse = await proxy(configuration, resourceObject);

    if (extensionResponse.success) {
      res.status(200).json({
        actions: extensionResponse.actions,
      });
    } else {
      res
        .status(extensionResponse.errorResponse.statusCode)
        .json(extensionResponse.errorResponse);
    }
  } catch (error) {
    logError(error, logger);

    if (resourceObject?.type === 'Order') {
      logger.error('Failed to process order', error);

      if (error instanceof CustomError) {
        setErrorResponse2(res, error);
      } else {
        setErrorResponse(res, 500, 'Internal Server Error');
      }
    } else {
      // for carts, we don't want to fail the whole cart update if the extension fails
      // E.g. we don't want to stop add to cart if the calculation of discounts fails
      res.status(200).json({
        actions: [],
      });
    }

    return;
  }
});

app.use('*wildcard', (_req: Request, res: Response) => {
  setErrorResponse(res, 404, 'Path not found.');
});

const logError = (error: unknown, logger: winston.Logger) => {
  if (error instanceof CustomError) {
    logger.error(error.statusCode + ' ' + error.message, error);
  } else {
    logger.error('Unhandled Error:', error);
  }
};

const setErrorResponse = (
  res: Response,
  statusCode: number,
  message: string
) => {
  res.status(statusCode).json({
    message: message,
  });
};

const setErrorResponse2 = (res: Response, customError: CustomError) => {
  res.status(customError.statusCode).json({
    message: customError.message,
    errors: customError.errors,
  });
};

export default app;
