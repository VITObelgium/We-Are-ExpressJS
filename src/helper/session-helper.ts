import {getSessionFromStorage, IStorage, Session} from "@inrupt/solid-client-authn-node";
import log from "loglevel";
import {filter, firstValueFrom, Subject} from "rxjs";

const refreshingSessions: string[] = [];
const refreshedSubject = new Subject<Session | Error | null>();

export async function getSessionFromStorageWrapper(sessionId: string, storage?: IStorage, onNewRefreshToken?: (newToken: string) => unknown) {
    if (refreshingSessions.indexOf(sessionId) > -1) {
        // The same session is executing multiple requests simultaneously
        log.debug(`Session ${sessionId} is already being fetched, so we wait for it to finish...`);

        // Await the required session, then continue. We don't need to subscribe, a single valid emit will be sufficient, use a promise.
        const session = await firstValueFrom(
            refreshedSubject.pipe(
                filter(
                    emittedValue =>
                        (!(emittedValue instanceof Error) &&
                            emittedValue?.info.sessionId /* null check is also included */ === sessionId) ||
                        (emittedValue instanceof Error && emittedValue.message === sessionId)
                ) // The value must be the required session, or an error thrown when fetching the session.
            )
        );

        if (session instanceof Error) {
            // We know that the error message is the required session ID at this point.
            throw session;
        }

        log.debug(`Succesfully waited for session [${sessionId}].`);
        return session;
    } else {
        // First tell system that session is being fetched. Next, await the session.
        refreshingSessions.push(sessionId);

        // Expose the session to the next middleware by using the response.
        let session = null;
        try {
            session = await getSessionFromStorage(
                sessionId,
                { storage }
            );
        } catch (error) {
            log.error(`Can't fetch session ${sessionId} from storage.\n${error}`);
            refreshedSubject.next(new Error(sessionId));
            refreshedSubject.next(null); // Emit a null value so previous value will no longer be used when a request is in queue.
            refreshingSessions.splice(refreshingSessions.indexOf(sessionId), 1);
            return null;
        }

        // Emit the session so that the waiting requests can continue.
        refreshedSubject.next(session!);
        refreshedSubject.next(null); // Emit a null value so previous value will no longer be used when a request is in queue.
        refreshingSessions.splice(refreshingSessions.indexOf(sessionId), 1);

        return session;
    }
}