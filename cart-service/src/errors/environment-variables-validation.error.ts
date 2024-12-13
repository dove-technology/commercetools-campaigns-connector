type EnvironmentVariablesValidationErrorItem = {
  code: number | string;
  message: string;
  referencedBy?: string;
};

class EnvironmentVariablesValidationError extends Error {
  code: string;
  message: string;
  errors: EnvironmentVariablesValidationErrorItem[];

  constructor(
    code: string,
    message: string,
    errors: EnvironmentVariablesValidationErrorItem[]
  ) {
    super(message);

    this.code = code;
    this.message = message;
    this.errors = errors;
  }
}

export default EnvironmentVariablesValidationError;
