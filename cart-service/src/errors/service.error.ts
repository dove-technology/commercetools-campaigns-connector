type ServiceErrorItem = {
  code: string;
  message: string;
};

class ServiceError extends Error {
  statusCode: number;
  message: string;
  errors: ServiceErrorItem[];

  constructor(statusCode: number, code: string, message: string) {
    super(message);

    this.statusCode = statusCode;
    this.message = message;
    this.errors = [{ code, message }];
  }
}

export default ServiceError;
