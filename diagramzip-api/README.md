# diagramzip-api

Cloudflare Worker for accountless diagram.zip persistence. D1 stores mutable
aliases and R2 stores immutable content-addressed bytes.

The committed production route is `diagram.zip/api/v1/*`, keeping the browser
same-origin and avoiding a CSP expansion. The D1 database and R2 bucket names
are configured, but the resources still need to be provisioned before the first
authorized deployment.

```sh
npm install
npm run cf-typegen
npm run migrate:local
npm test
npm run check
npm run dev
```

See [`../diagramzip/PERSISTENCE.md`](../diagramzip/PERSISTENCE.md) for the
product, storage, API, and security contracts.
