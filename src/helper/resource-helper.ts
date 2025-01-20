import {Request, Response} from "express";
import {HttpError} from "../http-error/http-error";
import {UploadedFile} from "express-fileupload";

/**
 * Validates the session to ensure it is authenticated and has a valid access grant.
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 * @throws {HttpError} Throws an error if the session is not valid or if there is no access grant.
 */
export function validateSession(req: Request, res: Response) {
    if (!res.locals.session?.info?.webId ||
        !res.locals.session?.info.isLoggedIn || !req.session?.solidSid) {
        throw new HttpError(
    "No valid authenticated session found.",
    401
        );
    }

    if (!req.session?.accessGrant) {
        throw new HttpError(
    "No valid access grant found for pod.",
    500
        );
    }
}

/**
 * Converts an uploaded file to a File object.
 * @param {UploadedFile} uploadedFile - The uploaded file from express-fileupload.
 * @returns {File} The converted File object.
 */
export function convertUploadedFileToFile(uploadedFile: UploadedFile): File {
    const scanFileContent = uploadedFile.data;
    return new File([scanFileContent], uploadedFile.name, {type: uploadedFile.mimetype});
}