import {Request, Response, NextFunction} from "express";
import {HttpError} from "../http-error/http-error";
import {turtleAsSolidDataset} from "@weare/weare-core";
import { PodService } from "@weare/weare-core";
import httpContext from "express-http-context";
import {convertUploadedFileToFile, validateSession} from "../helper/resource-helper";
import {UploadedFile} from "express-fileupload";
import {fromRdfJsDataset} from "@inrupt/solid-client";
import {Parser, Store} from "n3";

/**
 * Middleware to retrieve a resource from the user's pod and store the SolidDataset in `res.locals`.
 * Validates the session, extracts the resource URL from the query parameters, and retrieves the dataset.
 * The retrieved dataset is exposed to subsequent middlewares via `res.locals.solidDataset`.
 *
 * @param {Object} this - The context object containing the resource URL parameter key and pod service instance.
 * @param {Request} req - The Express request object, containing session and query parameters.
 * @param {Response} res - The Express response object.
 * @param {NextFunction} next - The next middleware function to call after retrieving the resource.
 * @throws {HttpError} - Throws a 400 error if the resource URL is missing or invalid.
 * @throws {Error} - Passes any other errors to the next middleware.
 */
export async function getResource(this: { resourceUrlParameterKey: string, podService: PodService }, req: Request, res: Response, next: NextFunction) {
    try {
        validateSession(req, res);

        const resourceIri = req.query[this.resourceUrlParameterKey];
        if (!resourceIri) {
            throw new HttpError(
                `The middleware retrieveResource requires a resource URL to be provided as a query parameter with key [${this.resourceUrlParameterKey}].`,
                400
            );
        }

        const accessGrant = JSON.parse(req.session.accessGrant!);

        res.locals.solidDataset = await this.podService.getSolidDataset(new URL(resourceIri as string), accessGrant, httpContext.get('correlationId'));

        next();
    } catch (error) {
        // A general error catcher which will, in turn, call the ExpressJS error handler.
        next(error);
    }
}

/**
 * Middleware to delete and write a SolidDataset to the user's pod.
 * Validates the session, retrieves the resource URL from the query parameters, deletes the existing dataset, and writes the new dataset from the request body.
 *
 * @param {Object} this - The context object containing the resource URL parameter key and pod service instance.
 * @param {Request} req - The Express request object, containing the body and query parameters.
 * @param {Response} res - The Express response object.
 * @param {NextFunction} next - The next middleware function to call after writing the dataset.
 * @throws {HttpError} - Throws a 400 error if the resource URL is missing or invalid.
 * @throws {Error} - Passes any other errors to the next middleware.
 */
export async function writeResource(this: { resourceUrlParameterKey: string, podService: PodService }, req: Request, res: Response, next: NextFunction) {
    try {
        validateSession(req, res);

        const resourceUrl = req.query[this.resourceUrlParameterKey];
        if (!resourceUrl) {
            throw new HttpError(
                `The middleware retrieveResource requires a resource URL to be provided as a query parameter with key [${this.resourceUrlParameterKey}].`,
                400
            );
        }

        const accessGrant = JSON.parse(req.session.accessGrant!);

        await this.podService.deleteSolidDataset(new URL(resourceUrl as string), accessGrant, httpContext.get('correlationId'));
        await this.podService.writeSolidDataset(new URL(resourceUrl as string), turtleAsSolidDataset(req.body), accessGrant, httpContext.get('correlationId'));

        next();
    } catch (error) {
        // A general error catcher which will, in turn, call the ExpressJS error handler.
        next(error);
    }
}

/**
 * Middleware to retrieve a file from the user's pod and store it in `res.locals`.
 * Validates the session, extracts the file URL from the query parameters, and retrieves the file.
 * The retrieved file is exposed to subsequent middlewares via `res.locals.file`.
 *
 * @param {Object} this - The context object containing the file URL parameter key and pod service instance.
 * @param {Request} req - The Express request object, containing session and query parameters.
 * @param {Response} res - The Express response object.
 * @param {NextFunction} next - The next middleware function to call after retrieving the file.
 * @throws {HttpError} - Throws a 400 error if the file URL is missing or invalid.
 * @throws {Error} - Passes any other errors to the next middleware.
 */
export async function getFile(this: { fileUrlParameterKey: string, podService: PodService }, req: Request, res: Response, next: NextFunction) {
    try {
        validateSession(req, res);

        const resourceIri = req.query[this.fileUrlParameterKey];
        if (!resourceIri) {
            throw new HttpError(
                `The middleware retrieveResource requires a resource URL to be provided as a query parameter with key [${this.fileUrlParameterKey}].`,
                400
            );
        }

        const accessGrant = JSON.parse(req.session.accessGrant!);

        res.locals.file = await this.podService.getFile(new URL(resourceIri as string), accessGrant, httpContext.get('correlationId'));

        next();
    } catch (error) {
        // A general error catcher which will, in turn, call the ExpressJS error handler.
        next(error);
    }
}

/**
 * Middleware to write a file to the user's pod.
 * Validates the session, extracts the file URL from the query parameters, and writes the uploaded file to the pod.
 *
 * @param {Object} this - The context object containing the file URL parameter key and pod service instance.
 * @param {Request} req - The Express request object, containing files and query parameters.
 * @param {Response} res - The Express response object.
 * @param {NextFunction} next - The next middleware function to call after writing the file.
 * @throws {HttpError} - Throws a 400 error if the file URL or uploaded file is missing or invalid.
 * @throws {Error} - Passes any other errors to the next middleware.
 */
export async function writeFile(this: { fileUrlParameterKey: string, podService: PodService }, req: Request, res: Response, next: NextFunction) {
    try {
        validateSession(req, res);
        const fileUrl = req.query[this.fileUrlParameterKey];
        if (!fileUrl) {
            throw new HttpError(
                `The middleware writeFile requires a file URL to be provided as a query parameter with key [${this.fileUrlParameterKey}].`,
                400
            );
        }
        if(!req.files)
            throw new HttpError(
                `No files are uploaded, or the express-fileupload module should be included.`,
                400
            );

        if(Object.values(req.files).length != 1 || Array.isArray(Object.values(req.files)[0])) {
            throw new HttpError(
                `One file should be uploaded.`,
                400
            );
        }

        const accessGrant = JSON.parse(req.session.accessGrant!);

        this.podService.writeFile(new URL(fileUrl as string), convertUploadedFileToFile(Object.values(req.files)[0] as UploadedFile), accessGrant, httpContext.get('correlationId'));

        next();
    } catch (error) {
        // A general error catcher which will, in turn, call the ExpressJS error handler.
        next(error);
    }
}