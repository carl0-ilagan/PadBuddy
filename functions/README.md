# Firebase Cloud Functions Setup

## Installation

1. Navigate to the functions directory:
```bash
cd functions
npm install
```

2. Build the functions:
```bash
npm run build
```

3. Deploy to Firebase:
```bash
firebase deploy --only functions
```

## Available Functions

### 1. `helloWorld` (HTTP)
A simple test function to verify deployment.

## Local Testing

```bash
cd functions
npm run serve
```

## Logs

```bash
firebase functions:log
```
