import {AccessGrant} from "@inrupt/solid-client-access-grants";

/**
 * Extends the Express session data interface to include Solid-specific properties.
 */
declare module "express-session" {
    interface SessionData {
        solidSid: string;
        locale?: string;
        pods?: string[];
        redirectUrl?: string; // Used to redirect the user after returning from IdP and some other cases.
        accessGrant?: string;
        accessGrantExpirationDate?: string;
        workaroundActive: 'create_web_id' | 'delete_pod';
    }
}

export function overrideSessionData() {
    // Dummy function, importing this function will override the ExpressJS session data interface.
}