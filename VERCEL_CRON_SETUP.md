# Vercel Cron Jobs Setup for Auto-Logging

This setup allows sensor readings to be automatically logged to Firestore even when the application is not running, using Vercel's Cron Jobs feature.

## How It Works

1. **Vercel Cron Job**: Runs every 10 minutes (`*/10 * * * *`)
2. **Checks RTDB**: Reads all devices from Firebase Realtime Database
3. **Finds Associated Paddies**: Uses Firestore collection group queries to find paddies linked to each device
4. **Logs to Firestore**: Writes sensor readings to each paddy's logs collection
5. **Deduplication**: Skips readings that were already logged within the last 5 minutes

## Setup Instructions

### 1. Install Dependencies

```bash
npm install firebase-admin
```

### 2. Get Firebase Service Account Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** → **Service Accounts**
4. Click **Generate New Private Key**
5. Download the JSON file

### 3. Set Environment Variables in Vercel

In your Vercel project settings, add these environment variables:

#### Required Variables:

```
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
CRON_SECRET=your-random-secret-string-here
```

**Important Notes:**
- `FIREBASE_PRIVATE_KEY`: Copy the entire private key from the JSON file, including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
- Replace `\n` with actual newlines when pasting, or Vercel will handle it automatically
- `CRON_SECRET`: Generate a random string (e.g., use `openssl rand -hex 32`)

### 4. Deploy to Vercel

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Deploy
vercel

# For production
vercel --prod
```

### 5. Verify Cron Job is Active

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Cron Jobs**
3. You should see the cron job listed: `/api/cron/log-sensors` running every 10 minutes

### 6. Test the Cron Job

You can manually trigger the cron job to test it:

```bash
curl -X GET "https://your-app.vercel.app/api/cron/log-sensors" \
  -H "Authorization: Bearer your-cron-secret"
```

Or test locally:

```bash
# Set environment variables in .env.local
# Then run:
curl -X GET "http://localhost:3000/api/cron/log-sensors" \
  -H "Authorization: Bearer your-cron-secret"
```

## Cron Schedule

The current schedule is set to run **every 10 minutes** (`*/10 * * * *`).

You can modify this in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/log-sensors",
      "schedule": "*/10 * * * *"  // Every 10 minutes
    }
  ]
}
```

Common schedules:
- `*/5 * * * *` - Every 5 minutes
- `*/15 * * * *` - Every 15 minutes
- `0 * * * *` - Every hour
- `0 */6 * * *` - Every 6 hours

## How It Differs from Client-Side Logging

### Client-Side (Current):
- Only works when user has the app open
- Logs when user views device/field pages
- Requires user interaction

### Vercel Cron (New):
- Works 24/7, even when app is closed
- Runs automatically every 10 minutes
- No user interaction required
- More reliable for continuous data collection

## Monitoring

Check Vercel logs to see cron job execution:
1. Go to Vercel Dashboard → Your Project → **Logs**
2. Filter by `/api/cron/log-sensors`
3. You'll see execution logs and any errors

## Troubleshooting

### Cron job not running
- Check that `vercel.json` is in the root directory
- Verify cron job appears in Vercel dashboard
- Check environment variables are set correctly

### Authentication errors
- Verify `FIREBASE_PRIVATE_KEY` includes newlines (`\n`)
- Check `FIREBASE_CLIENT_EMAIL` matches service account email
- Ensure `FIREBASE_PROJECT_ID` is correct

### No logs being created
- Check Vercel function logs for errors
- Verify devices exist in RTDB with NPK data
- Ensure paddies are linked to devices (`deviceId` field)
- Check Firestore rules allow writes

## Security

- The cron endpoint is protected by `CRON_SECRET`
- Only Vercel's cron service (and manual requests with the secret) can trigger it
- Firebase Admin SDK uses service account credentials (server-side only)
- Never commit `.env` files or service account keys to git
