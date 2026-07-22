# PCE Embedded App

Angular shell for the PCE dashboards and embedded Streamlit analytics pages.

## Development

Angular 22 requires Node.js 22.22.3+, 24.15.0+, or 26+. This project pins
Node.js 24.15.0 for nvm users. Install/select it, then install dependencies and
start the local Angular development server:

```bash
nvm install
nvm use
npm install
npm start
```

The app is available at `http://localhost:4200/`. By default, analytics pages embed Streamlit from `http://localhost:8501/`. Configure that endpoint with `streamlitBaseUrl` in `src/environments/environment.ts` for the target deployment.

## Verification

Run the production build and headless unit tests:

```bash
npm run build
npm test -- --watch=false --browsers=ChromeHeadless
```

Package scripts must be run with `npm run`, so use `npm run build` rather than
`npm build`.

## Embedding behavior

Analytics routes reuse a small cache of recently visited Streamlit iframes to make back-and-forth navigation responsive without retaining every background session. Streamlit messages are accepted only from the active iframe at the configured Streamlit origin, and authenticated MSAL account IDs provide per-user Trends persistence without appearing in share URLs.
