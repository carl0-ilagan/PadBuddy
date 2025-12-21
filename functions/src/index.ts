import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// Initialize Firebase Admin explicitly with RTDB URL for reliability
admin.initializeApp({
  databaseURL: "https://rice-padbuddy-default-rtdb.asia-southeast1.firebasedatabase.app",
});

/**
 * RTDB → Firestore logging
 * Listens to sensor updates under /devices/{deviceId}/sensors and writes
 * a time-series log entry to Firestore for trend analysis.
 *
 * RTDB is kept lean (current state via PUT); history is stored in Firestore.
 */
export const logDeviceSensorUpdates = functions.database
  .ref("/devices/{deviceId}/{dataNode}")
  .onWrite(async (change, context) => {
    const deviceId = context.params.deviceId as string;
    const dataNode = (context.params as any).dataNode as string;

    // Only react to sensor-like nodes
    const allowedNodes = new Set(["sensors", "npk", "readings"]);
    if (!allowedNodes.has(dataNode)) {
      return null;
    }

    const after = change.after.exists() ? change.after.val() : null;
    const before = change.before.exists() ? change.before.val() : null;

    if (!after) {
      // Deleted node; nothing to log
      return null;
    }

    // Normalize readings (support multiple field names and casings)
    const nitrogen = after.nitrogen ?? after.n ?? after.N ?? null;
    const phosphorus = after.phosphorus ?? after.p ?? after.P ?? null;
    const potassium = after.potassium ?? after.k ?? after.K ?? null;
    const deviceTimestamp = after.lastUpdate ?? after.timestamp ?? after.ts ?? null;

    // Skip if no actual readings present
    if (nitrogen === null && phosphorus === null && potassium === null) {
      return null;
    }

    // Basic dedup: only log if values or timestamp changed
    const changed = !before ||
      before?.nitrogen !== nitrogen ||
      before?.phosphorus !== phosphorus ||
      before?.potassium !== potassium ||
      before?.lastUpdate !== deviceTimestamp ||
      before?.timestamp !== deviceTimestamp ||
      before?.ts !== deviceTimestamp;

    if (!changed) {
      return null;
    }

    const firestore = admin.firestore();
    const logPayload = {
      nitrogen,
      phosphorus,
      potassium,
      deviceTimestamp: deviceTimestamp ?? null,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      source: `rtdb-trigger:${dataNode}`,
    };

    try {
      // Find paddies bound to this device via collection group query
        console.log("[logDeviceSensorUpdates] deviceId=", deviceId, "node=", dataNode, "payload=", { nitrogen, phosphorus, potassium, deviceTimestamp });
      const paddiesSnapshot = await firestore
        .collectionGroup("paddies")
        .where("deviceId", "==", deviceId)
        .get();

      if (!paddiesSnapshot.empty) {
          console.log("[logDeviceSensorUpdates] Found paddies:", paddiesSnapshot.size);
        // Write logs under each matched paddy
        const writes: Promise<FirebaseFirestore.DocumentReference>[] = [];
        paddiesSnapshot.forEach((paddyDoc) => {
          const logsCol = paddyDoc.ref.collection("logs");
          writes.push(logsCol.add(logPayload));
        });
        await Promise.all(writes);
      } else {
          console.log("[logDeviceSensorUpdates] No paddies found for device; writing to fallback deviceLogs.");
        // Fallback: write logs under a device-centric path for visibility
        await firestore
          .collection("deviceLogs")
          .doc(deviceId)
          .collection("readings")
          .add(logPayload);
      }

      return null;
    } catch (err) {
      console.error("Error logging RTDB sensor update:", err);
      return null;
    }
  });

// Basic test endpoint remains
export const helloWorld = functions.https.onRequest((request, response) => {
  response.send("Hello from PadBuddy Cloud Functions!");
});
