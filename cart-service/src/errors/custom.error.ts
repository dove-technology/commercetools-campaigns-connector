type CustomErrorItem = {
  code: number | string;
  message: string;
};

class CustomError extends Error {
  statusCode: number;
  message: string;
  errors?: CustomErrorItem[];

  constructor(statusCode: number, code: string, message: string) {
    super(message);

    this.statusCode = statusCode;
    this.message = message;
    this.errors = [{ code, message }];
  }
}

export default CustomError;
