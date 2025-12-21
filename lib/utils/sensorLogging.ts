import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { DeviceNPK } from './deviceStatus';

/**
 * Log NPK sensor readings to Firestore for historical tracking
 * 
 * This should be called when fetching fresh sensor data from RTDB
 * to maintain a historical record for trends and analysis
 * 
 * Converts RTDB format (n, p, k) to Firestore format (nitrogen, phosphorus, potassium)
 */
export async function logSensorReadings(
  userId: string,
  fieldId: string,
  paddyId: string,
  npk: DeviceNPK
): Promise<void> {
  try {
    // Only log if we have actual readings
    if (!npk || (npk.n === undefined && npk.p === undefined && npk.k === undefined)) {
      return;
    }
    
    const logsRef = collection(db, `users/${userId}/fields/${fieldId}/paddies/${paddyId}/logs`);
    await addDoc(logsRef, {
      // Convert n, p, k to nitrogen, phosphorus, potassium for Firestore
      nitrogen: npk.n,
      phosphorus: npk.p,
      potassium: npk.k,
      timestamp: serverTimestamp(),
      createdAt: new Date().toISOString(),
      // Keep original timestamp from device if available
      deviceTimestamp: npk.timestamp,
    });
    
    console.log(`Sensor readings logged for paddy ${paddyId}`);
  } catch (error) {
    console.error('Error logging sensor readings:', error);
  }
}

/**
 * Log sensor readings from SensorReadings format (backward compatibility)
 */
export async function logSensorReadingsLegacy(
  userId: string,
  fieldId: string,
  paddyId: string,
  readings: {
    nitrogen?: number;
    phosphorus?: number;
    potassium?: number;
    temperature?: number;
    humidity?: number;
    waterLevel?: number;
    timestamp?: number;
  }
): Promise<void> {
  try {
    if (Object.keys(readings).length === 0) {
      return;
    }
    
    const logsRef = collection(db, `users/${userId}/fields/${fieldId}/paddies/${paddyId}/logs`);
    await addDoc(logsRef, {
      ...readings,
      timestamp: serverTimestamp(),
      createdAt: new Date().toISOString(),
    });
    
    console.log(`Sensor readings logged for paddy ${paddyId}`);
  } catch (error) {
    console.error('Error logging sensor readings:', error);
  }
}

/**
 * Auto-log readings every update.
 * Logs when any of n/p/k changes.
 * Simple dedup: skip if same values logged within 1 second.
 */
type LastLog = { n?: number; p?: number; k?: number; lastLogTime: number };
const lastLogs = new Map<string, LastLog>();

export async function autoLogReadings(
  userId: string,
  fieldId: string,
  paddyId: string,
  npk: DeviceNPK
): Promise<void> {
  const key = `${userId}_${fieldId}_${paddyId}`;
  const last = lastLogs.get(key);
  const now = Date.now();

  // Skip if same values logged within 1 second
  if (last && last.n === npk?.n && last.p === npk?.p && last.k === npk?.k && (now - last.lastLogTime) < 1000) {
    return;
  }

  await logSensorReadings(userId, fieldId, paddyId, npk);
  lastLogs.set(key, { n: npk?.n, p: npk?.p, k: npk?.k, lastLogTime: now });
}
