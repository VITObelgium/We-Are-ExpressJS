import { NextFunction, Request, Response } from "express";
import log from "loglevel";
import { HttpError } from "./http-error";

/**
 * Middleware function to handle errors.
 * @param {Error} error - The error object.
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 * @param {NextFunction} next - The next middleware function.
 */
export function errorHandler(error: Error, req: Request, res: Response, next: NextFunction) {
  log.error(error.message);
  log.error(error.stack);

  if (error instanceof HttpError) {
    res.status(error.statusCode || 500).send(error.message);
  } else {
    res.status(500).send(error.message);
  }
}
