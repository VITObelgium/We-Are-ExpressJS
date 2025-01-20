# Introduction - We Are Project and We Are Platform

The We Are partnership, consisting of the Flemish Institute for Technological Research (VITO) – Flemish Patients' Platform (VPP) – Domus Medica (DM) – Zorgnet Icuro (ZI), is committed to enabling the ethical and safe reuse of personal health data for both public and private purposes, with the citizen at the center. The project collaborates closely with Athumi, the provider of the [SOLID] (https://solidproject.org/TR/) data vault system in Flanders. This system allows citizens to securely store their data in vaults and share it with third parties based on consent. This project was made possible thanks to the European recovery fund; the Department of Economy, Science & Innovation; the Department of Care & the Department of Digital Flanders. More information at [www.we-are-health.be](https://www.we-are-health.be).

# We Are Express-js

We Are Express-js is a Typescript library that can act on express js applications as middleware to provide you with boilerplate functionality to interact with We Are and the Athumi Solid architecture.

We Are Express-js library that needs to be used for interacting with Athumi Solid pods on We Are are concentrated in the ```middleware``` directory. It contains logic to interact with the pods and verifiable credentials via authenticated sessions. In order to store extra information, we also created a ```session-data.ts``` module to keep the relevant Solid session data.

## middleware

### pod-middleware.ts

This is middleware to get the pods of a user. The option exists to make a session mandatory. If the requestor doesn't have a valid session, a ```401``` will be thrown.

### resource-middleware.ts

Middleware that can be used to do interaction with the pod: ```getResource``` and ```writeResource```, which will interact with the pod with linked data. It will respectively retrieve and write a Solid Dataset to the pod. The other two functions are ```readFile``` and ```writeFile```. They will read and write files to the pod automaticaly as middleware. The files don't need to be RDF data. 

(note) If file upload want to be used via resource-middleware the file-upload needs to be loaded as middleware: app.use(fileUpload({debug: true}));


### session-middleware.ts

The ```session-middleware.ts``` to fetch the session from storage and expose it to the next middleware. The session must be authenticated; otherwise, an error will be thrown in case it is mandatory. This middleware can be reused for all routes requiring authentication. The session is made available to other middlewares by the following command:

```
        res.locals.session = await getSessionFromStorageWrapper(
            req.session.solidSid!,
            this?.storage as IStorage | undefined
        ).catch(() => { /* ignore error, handled below */ });
```

### vc-middleware.ts

The ```validateAccessGrant```middleware function is used to validate the presence and validity of an access grant in the session. This function checks if an access grant is stored in the session and if it has not expired. If the access grant is missing or expired, the request is rejected with a 403 status code.

## session

Extra Solid information in the session is

* ```solidSid```: this contains the solid Session id.
* ```locale```: this is the locale of the logged in user.
* ```pods```: a list of pod addresses belonging to the user.
* ```redirectUrl```: the redirect url used to redirect the user after returning from IdP
* ```accessGrant```: the access grant for the backend application
* ```accessGrantExpirationDate```: the access grant expiration date. This is handy to check validity of the access grant.
* ```workaroundActive```: a temporary workaround which can contain the values: 'create_web_id' or 'delete_pod'




