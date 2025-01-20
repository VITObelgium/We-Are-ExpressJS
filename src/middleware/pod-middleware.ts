import {NextFunction, Request, Response} from "express";
import {getPodUrlAll} from "@inrupt/solid-client";
import log from "loglevel";
import {HttpError} from "../http-error/http-error";

/**
 * Middleware to fetch all Pod URLs associated with the user's WebID.
 * If no authenticated session is found, it returns an unauthorized error (401).
 * Stores the retrieved Pod URLs in `res.locals.pods` for access by subsequent middleware.
 *
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object. It uses `res.locals` to store the session information and Pod URLs.
 * @param {NextFunction} next - The next middleware function to call after fetching the Pods.
 * @throws {HttpError} - Throws a 401 error if the session is not authenticated, and a 404 error if no Pods are found for the WebID.
 * @throws {Error} - Passes any other errors to the next middleware.
 */
export async function getPods(req: Request, res: Response, next: NextFunction) {
    return getPodsMandatoryOrOptional(req, res, next);
}

/**
 * Middleware alias for `getPods` to ensure that fetching Pods is mandatory.
 * This will throw an error if the session is not authenticated or no Pods are found.
 *
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 * @param {NextFunction} next - The next middleware function to call after fetching the Pods.
 * @throws {HttpError} - Throws a 401 error if the session is not authenticated.
 * @throws {Error} - Passes any other errors to the next middleware.
 */
export async function getPodsMandatory(req: Request, res: Response, next: NextFunction) {
    return getPods(req, res, next);
}

/**
 * Middleware alias for `getPodsMandatoryOrOptional` where fetching Pods is optional.
 * If the session is not authenticated or no Pods are found, it simply moves to the next middleware without throwing errors.
 *
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 * @param {NextFunction} next - The next middleware function to call after the optional fetch attempt.
 */
export async function getPodsOptional(req: Request, res: Response, next: NextFunction) {
    return getPodsMandatoryOrOptional(req, res, next, false);
}

/**
 * Internal function to fetch all Pod URLs associated with the user's WebID.
 * If the session is not authenticated or no WebID is present, it throws a 401 error (if mandatory).
 * If no Pods are found, it throws a 404 error (if mandatory). Otherwise, it stores the Pod URLs in `res.locals.pods`.
 *
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object, which contains session information and stores the Pod URLs in `res.locals.pods`.
 * @param {NextFunction} next - The next middleware function to call after fetching the Pods.
 * @param {boolean} [mandatory=true] - Specifies if the session and Pod retrieval are mandatory. If `false`, errors are not thrown and the middleware proceeds.
 * @throws {HttpError} - Throws a 401 error if the session is not authenticated, and a 404 error if no Pods are found (only when `mandatory` is true).
 * @throws {Error} - Passes any other errors to the next middleware.
 */
export async function getPodsMandatoryOrOptional(req: Request, res: Response, next: NextFunction, mandatory: boolean = true) {
    try {
        if ((!res.locals.session?.info?.webId || !res.locals.session.info.isLoggedIn)) {
            if (mandatory) {
                next(new HttpError("[fetchPodsMandatoryOrOptional] Fetching Pods - but no valid authenticated session found.", 401));
                return;
            } else {
                next();
                return;
            }
        }

        const userPods = await getPodUrlAll(res.locals.session.info.webId); //TODO createFetchFunctionWithIds?

        if (userPods.length === 0 && mandatory) {
            next(new HttpError(`[fetchPods] No Pods found for WebID [${res.locals.session.info.webId}].`, 404));
            return;
        }

        log.debug(`[fetchPods] Found [${userPods.length}] Pods for webid [${res.locals.session.info.webId}].`);

        res.locals.pods = userPods;

        next();
    } catch (error) {
        // A general error catcher which will, in turn, call the ExpressJS error handler.
        next(error);
    }
}
