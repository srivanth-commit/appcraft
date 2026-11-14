# Zentimer

Offline-only Pomodoro timer with statistics.

## Run locally

```
npm ci && npm run dev
```

## Build

```
npm ci && npm run build && npm run preview
```

## Data & backup

IndexedDB is stored in your browser profile and is device-local.
It can be cleared by the browser under storage pressure or when clearing site data.
Export your data regularly using the Export button in the app.
Importing overwrites all existing data — keep a backup before importing.
