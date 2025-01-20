/**
 * Custom error class for HTTP errors.
 */

export class HttpError extends Error {
  statusCode: number;

  /**
   * Creates an instance of HttpError.
   * @param {string} message - The error message.
   * @param {number} statusCode - The HTTP status code.
   */
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}
