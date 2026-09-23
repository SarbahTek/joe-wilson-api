# Joe Wilson API fixes

Applied fixes:

1. Registered `GET /v1/auth/me` with bearer authentication.
2. Registered `POST /v1/auth/refresh` using the refresh token body.
3. Registered `POST /v1/auth/logout` with bearer authentication.
4. Registered the already-implemented `PATCH /v1/auth/me` profile update route.
5. Made `GET /v1/masterclasses` public so visitors can browse published classes before signing up.
6. Kept `GET /v1/masterclasses/:id` and `/sessions` authenticated.
7. Updated Swagger for the public masterclass catalog and confirmed auth endpoints are documented at `/v1/auth/...` via the `/v1` server base URL.
8. Updated README endpoint classification.
9. Verified the TypeScript project builds successfully with `npm run build`.

## Railway

The uploaded project does not contain Railway runtime/deployment logs, so intermittent 502 responses cannot be verified from the source archive alone. After pushing this revision, check the Railway deployment/runtime logs around the timestamps of the 502s and confirm the deployed commit is the revision containing these changes.
