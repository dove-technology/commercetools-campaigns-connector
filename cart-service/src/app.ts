import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import CustomError from './errors/custom.error';
import { proxy } from './lib/commerce-tools-dovetech-proxy';
import { readConfiguration } from './utils/config.utils';
import { getLogger } from './utils/logger.utils';
import AggregateTotalMismatchError from './errors/aggregate-total-mismatch.error';

dotenv.config();

const configuration = readConfiguration();

const app = express();
app.disable('x-powered-by');
app.use(bodyParser.json());

app.post('/cart-service', async (req: Request, res: Response) => {

  //check if the request has a basic auth header
  if (!req.headers.authorization) {
    setErrorResponse(res, 403, 'Forbidden');
    return;
  }

  //check if the request header has the correct basic auth password and return 403 if it does not

  const basicAuthPassword = configuration.connectorBasicAuthPassword;
  const authHeader = req.headers.authorization;
  const encodedPassword = authHeader.split(' ')[1];
  const decodedPassword = Buffer.from(encodedPassword, 'base64').toString('utf-8');
  if (decodedPassword !== basicAuthPassword) {
    setErrorResponse(res, 403, 'Forbidden');
    return;
  }



  const { resource } = req.body;

  if (!resource?.obj) {
    setErrorResponse(res, 400, 'Bad request - Missing resource object.');
    return;
  }

  try {
    const resourceObject = resource.obj;

    const extensionResponse = await proxy(configuration, resourceObject);

    if (extensionResponse.success) {
      res.status(200).json({
        actions: extensionResponse.actions,
      });
      return;
    }
    res
      .status(extensionResponse.errorResponse.statusCode)
      .json(extensionResponse.errorResponse);
  } catch (error) {
    const logger = getLogger();

    if (error instanceof CustomError) {
      logger.error(error.statusCode + ' ' + error.message);
    } else if (error instanceof AggregateTotalMismatchError) {
      res.status(400).json({
        errors: [
          {
            code: 'InvalidOperation',
            message:
              'Expected aggregate total does not match latest aggregate total',
          },
        ],
      });
      return;
    } else {
      logger.error(error);
    }

    // we don't want to fail the action if the extension fails so return empty actions
    res.status(200).json({
      actions: [],
    });
    return;
  }
});

app.use('*', (_req: Request, res: Response) => {
  setErrorResponse(res, 404, 'Path not found.');
});

const setErrorResponse = (
  res: Response,
  statusCode: number,
  message: string
) => {
  res.status(statusCode).json({
    message: message,
  });
};

export default app;
