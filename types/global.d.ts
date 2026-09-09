/**
 * Extends the Express session data interface to include Solid-specific properties.
 *
 * This file must contain at least one top-level `import`/`export` so that TypeScript treats it
 * as a module. Without that, `declare module "express-session"` below is parsed as a brand-new
 * ambient module declaration instead of a module augmentation, so it does not merge with the
 * `SessionData` interface shipped by `@types/express-session`, and the properties added here
 * remain invisible wherever `req.session` is used (e.g. resource-middleware.ts).
 */
export {};

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
