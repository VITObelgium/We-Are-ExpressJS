import {NextFunction, Request, Response} from "express";
import log from "loglevel";
import {VcServiceV2} from "@weare/weare-core";
import httpContext from "express-http-context";
import {AccessGrantFilter} from "@inrupt/solid-client-access-grants/dist/gConsent/query/query";

/**
 * Middleware function to validate the presence and validity of an access grant in the session.
 * This function checks if an access grant is stored in the session and if it has not expired.
 * If the access grant is missing or expired, the request is rejected with a 403 status code.
 *
 * @param {Request} req - The Express request object, which should contain the session data.
 * @param {Response} res - The Express response object, used to send error responses if validation fails.
 * @param {NextFunction} next - The next middleware function to call if validation passes.
 * @this {any} context - The function may optionally use this binding to access additional context.
 */
export async function validateAccessGrant(this: any, req: Request, res: Response, next: NextFunction) {
    if (!req.session.accessGrant) {
        log.debug(`[fetchAccessGrantMandatoryOrOptional] No access grant found in session.`);

        res.status(403).send("No access grant for pod found.");
        return;
    }

    if (req.session.accessGrantExpirationDate && new Date(req.session.accessGrantExpirationDate).getTime() < Date.now()) {
        log.debug(`[fetchAccessGrantMandatoryOrOptional] Access grant expired.`);

        res.status(403).send("Access grant for pod has expired.");
        return;
    }

    next();
}

export async function fetchAccessGrants(this: { credentialResultParameterKey?: string, vcService: VcServiceV2, fetchWithSession? : boolean }, req: Request, res: Response, next: NextFunction) {
    try {
        if(!this.credentialResultParameterKey) this.credentialResultParameterKey = 'credentialResult';

        const accessGrantFilters = JSON.parse(JSON.stringify(req.params.accessGrantFilter)) as AccessGrantFilter;

        // @ts-ignore
        res.locals[this.credentialResultParameterKey] = await this.vcService.fetchAccessGrants(httpContext.get('correlationId'), accessGrantFilters, this.fetchWithSession ? res.locals.session.fetch : undefined);

        next();
    } catch (error) {
        // A general error catcher which will, in turn, call the ExpressJS error handler.
        next(error);
    }
}