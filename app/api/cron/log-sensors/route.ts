import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getDatabase, Database } from 'firebase-admin/database';

// Initialize Firebase Admin (server-side only)
let db: Firestore;
let database: Database;

try {
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    });
  }
  db = getFirestore();
  database = getDatabase();
} catch (error) {
  console.error('Firebase Admin initialization error:', error);
  // Will throw error when trying to use db/database if not initialized
}

/**
 * Vercel Cron Job: Auto-log sensor readings from RTDB to Firestore
 * 
 * This runs periodically (configured in vercel.json) to check for new
 * sensor readings in RTDB and log them to Firestore, even when the app is not running.
 * 
 * Security: Protected by Vercel Cron secret
 */
export async function GET(request: NextRequest) {
  // Verify this is a legitimate cron request
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if Firebase Admin is initialized
  if (!db || !database) {
    return NextResponse.json(
      { success: false, error: 'Firebase Admin not initialized' },
      { status: 500 }
    );
  }

  try {
    console.log('[Cron] Starting sensor logging job...');
    
    // Get all devices from RTDB
    const devicesRef = database.ref('devices');
    const devicesSnapshot = await devicesRef.once('value');
    
    if (!devicesSnapshot.exists()) {
      console.log('[Cron] No devices found in RTDB');
      return NextResponse.json({ 
        success: true, 
        message: 'No devices found',
        logged: 0 
      });
    }

    const devices = devicesSnapshot.val();
    let totalLogged = 0;
    const errors: string[] = [];

    // Process each device
    for (const [deviceId, deviceData] of Object.entries(devices) as [string, any][]) {
      try {
        // Get NPK data from device
        const npk = deviceData.npk || deviceData.sensors || deviceData.readings;
        
        if (!npk) {
          continue; // Skip devices without sensor data
        }

        // Normalize readings
        const nitrogen = npk.nitrogen ?? npk.n ?? npk.N ?? null;
        const phosphorus = npk.phosphorus ?? npk.p ?? npk.P ?? null;
        const potassium = npk.potassium ?? npk.k ?? npk.K ?? null;
        const deviceTimestamp = npk.lastUpdate ?? npk.timestamp ?? npk.ts ?? Date.now();

        // Skip if no actual readings
        if (nitrogen === null && phosphorus === null && potassium === null) {
          continue;
        }

        // Find paddies associated with this device
        const paddiesSnapshot = await db
          .collectionGroup('paddies')
          .where('deviceId', '==', deviceId)
          .get();

        if (paddiesSnapshot.empty) {
          console.log(`[Cron] No paddies found for device ${deviceId}`);
          continue;
        }

        // Log to each associated paddy
        const logPayload = {
          nitrogen,
          phosphorus,
          potassium,
          deviceTimestamp: deviceTimestamp ?? null,
          timestamp: new Date(),
          createdAt: new Date().toISOString(),
          source: 'vercel-cron',
        };

        const writes: Promise<any>[] = [];
        paddiesSnapshot.forEach((paddyDoc) => {
          const logsCol = paddyDoc.ref.collection('logs');
          
          // Check if we already logged this reading (deduplication)
          // We'll check the last log to avoid duplicates
          writes.push(
            logsCol
              .orderBy('timestamp', 'desc')
              .limit(1)
              .get()
              .then((lastLogSnapshot) => {
                if (!lastLogSnapshot.empty) {
                  const lastLog = lastLogSnapshot.docs[0].data();
                  const lastLogTime = lastLog.timestamp?.toDate?.()?.getTime() || lastLog.timestamp?.getTime() || 0;
                  const currentTime = deviceTimestamp || Date.now();
                  
                  // Skip if same values logged within last 5 minutes
                  if (
                    lastLog.nitrogen === nitrogen &&
                    lastLog.phosphorus === phosphorus &&
                    lastLog.potassium === potassium &&
                    (currentTime - lastLogTime) < 5 * 60 * 1000
                  ) {
                    return null; // Skip duplicate
                  }
                }
                
                // Log the reading
                return logsCol.add(logPayload);
              })
          );
        });

        const results = await Promise.all(writes);
        const successful = results.filter(r => r !== null).length;
        totalLogged += successful;

        if (successful > 0) {
          console.log(`[Cron] Logged ${successful} reading(s) for device ${deviceId}`);
        }
      } catch (error: any) {
        const errorMsg = `Error processing device ${deviceId}: ${error.message}`;
        console.error(`[Cron] ${errorMsg}`);
        errors.push(errorMsg);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${Object.keys(devices).length} device(s)`,
      logged: totalLogged,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error('[Cron] Fatal error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message 
      },
      { status: 500 }
    );
  }
}
