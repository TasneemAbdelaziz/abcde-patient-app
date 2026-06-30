# Firebase credentials

Drop the Firebase **service-account JSON** here as `service-account.json`:

> Firebase Console → Project settings → **Service accounts** →
> *Generate new private key*

It is what the server uses to mint OAuth2 tokens for the FCM HTTP v1 API
(`POST /remote/open`). The file is **git-ignored** (`storage/app/firebase/*.json`)
— never commit it.

To use a different path, set `FIREBASE_CREDENTIALS` in `.env`. The project id is
read from the JSON automatically; override it with `FIREBASE_PROJECT_ID` if
needed. Without this file, push is skipped gracefully and `/remote/open` returns
`sent_to: 0`.
