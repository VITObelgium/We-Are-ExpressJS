import {Request, Response, NextFunction} from "express";
import {getSessionFromStorage, IStorage} from "@inrupt/solid-client-authn-node";
import {getSessionFromStorageWrapper} from "../helper/session-helper";

/**
 * Middleware to fetch the session from storage and expose it to the next middleware.
 * The session must be authenticated; otherwise, an error will be thrown.
 * This middleware can be reused for all routes requiring authentication.
 *
 * @param {Object} this - The context object that may contain a custom storage implementation.
 * @param {Request} req - The Express request object, containing session data.
 * @param {Response} res - The Express response object, used to send an error response if the session is not authenticated.
 * @param {NextFunction} next - The next middleware function to call if the session is valid.
 * @returns {Promise<void>} - A Promise that resolves when the session is successfully validated.
 */
export async function getSession(this: { storage?: IStorage }, req: Request, res: Response, next: NextFunction) {
    return getSessionMandatoryOrOptional.bind(this)(req, res, next);
}

/**
 * Middleware alias for `getSession`, ensuring that the session is mandatory and authenticated.
 * This can be used in routes where an authenticated session is required.
 *
 * @param {Object} this - The context object that may contain a custom storage implementation.
 * @param {Request} req - The Express request object, containing session data.
 * @param {Response} res - The Express response object.
 * @param {NextFunction} next - The next middleware function to call if the session is valid.
 * @returns {Promise<void>} - A Promise that resolves when the session is successfully validated.
 */
export async function getSessionMandatory(this: { storage?: IStorage }, req: Request, res: Response, next: NextFunction) {
    return getSession.bind(this)(req, res, next);
}

/**
 * Middleware that attempts to fetch the session from storage, but does not require an authenticated session.
 * This can be used in routes where the session is optional but may provide additional context if available.
 *
 * @param {Object} this - The context object that may contain a custom storage implementation.
 * @param {Request} req - The Express request object, containing session data.
 * @param {Response} res - The Express response object.
 * @param {NextFunction} next - The next middleware function to call, whether the session is valid or not.
 * @returns {Promise<void>} - A Promise that resolves after attempting to fetch the session.
 */
export async function getSessionOptional(this: { storage?: IStorage }, req: Request, res: Response, next: NextFunction) {
    return getSessionMandatoryOrOptional.bind(this)(req, res, next, false);
}

/**
 * Internal function to handle session fetching, optionally requiring an authenticated session.
 * This is not exported and is used internally by `getSession`, `getSessionMandatory`, and `getSessionOptional`.
 * It fetches the session from storage and validates it if `mandatory` is true.
 *
 * @param {Object} this - The context object that may contain a custom storage implementation.
 * @param {Request} req - The Express request object, containing session data.
 * @param {Response} res - The Express response object, used to send error responses if validation fails.
 * @param {NextFunction} next - The next middleware function to call after validation.
 * @param {boolean} [mandatory=true] - Indicates whether an authenticated session is mandatory.
 * @returns {Promise<void>} - A Promise that resolves after session validation or returns an error if the session is invalid.
 */
async function getSessionMandatoryOrOptional(
    this: { storage?: IStorage },
    req: Request,
    res: Response,
    next: NextFunction,
    mandatory: boolean = true
) {
    try {
        if (!req.session?.solidSid) {
            if(mandatory) {
                res.status(401).send("Unauthorized");
                return;
            } else {
                next();
                return;
            }
        }

        res.locals.session = await getSessionFromStorageWrapper(
            req.session.solidSid!,
            this?.storage as IStorage | undefined
        ).catch(() => { /* ignore error, handled below */ });

        if (mandatory && (!res.locals.session?.info?.webId || !res.locals.session?.info?.isLoggedIn)) {
            res.status(401).send("Unauthorized");
            return;
        }

        next();
        return;
    } catch (error) {
        // A general error catcher which will, in turn, call the ExpressJS error handler.
        next(error);
    }
}