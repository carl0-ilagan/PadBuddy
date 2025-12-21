import { useEffect, useRef } from 'react';
import { database } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import { notifyDeviceOffline, notifyDeviceOnline } from '@/lib/utils/notifications';

interface DeviceMonitorConfig {
  userId: string;
  deviceId: string;
  paddyName?: string;
  fieldId?: string;
  fieldName?: string;
  enabled?: boolean;
}

const OFFLINE_THRESHOLD = 2 * 60 * 1000; // 2 minutes in milliseconds
const CHECK_INTERVAL = 30 * 1000; // Check every 30 seconds

/**
 * Monitor device status and NPK readings
 * Sends notifications when device goes offline or sensor stops updating
 */
export function useDeviceMonitoring(configs: DeviceMonitorConfig[]) {
  const lastStatusRef = useRef<{ [key: string]: { online: boolean; hasNPK: boolean } }>({});
  const notificationSentRef = useRef<{ [key: string]: boolean }>({});

  useEffect(() => {
    if (configs.length === 0 || !configs.some(c => c.enabled !== false)) return;

    const unsubscribers: (() => void)[] = [];
    const monitorIntervals: NodeJS.Timeout[] = [];

    configs.forEach(config => {
      if (config.enabled === false) return;

      const { userId, deviceId, paddyName, fieldId, fieldName } = config;
      
      // Initialize status tracking
      if (!lastStatusRef.current[deviceId]) {
        lastStatusRef.current[deviceId] = { online: true, hasNPK: true };
        notificationSentRef.current[deviceId] = false;
      }

      // Listen to device data in real-time
      const deviceRef = ref(database, `devices/${deviceId}`);
      const unsubscribe = onValue(deviceRef, (snapshot) => {
        if (!snapshot.exists()) {
          checkAndNotify(userId, deviceId, paddyName, fieldId, fieldName, false, false);
          return;
        }

        const deviceData = snapshot.val();
        const now = Date.now();

        // Check heartbeat (status + timestamp)
        const hasHeartbeat = deviceData.status === 'connected' || 
          deviceData.status === 'alive';

        // Check NPK timestamp (should be within last 2 minutes)
        let hasRecentNPK = false;
        if (deviceData.npk?.timestamp) {
          const npkTimestamp = deviceData.npk.timestamp;
          // Handle both seconds and milliseconds timestamps
          const npkTime = npkTimestamp < 10000000000 ? npkTimestamp * 1000 : npkTimestamp;
          const timeSinceNPK = now - npkTime;
          hasRecentNPK = timeSinceNPK < OFFLINE_THRESHOLD;
        }

        // Device is considered "online" if it has heartbeat OR recent NPK readings
        const isOnline = hasHeartbeat || hasRecentNPK;
        const hasNPK = deviceData.npk && (
          deviceData.npk.n !== undefined || 
          deviceData.npk.p !== undefined || 
          deviceData.npk.k !== undefined
        );

        checkAndNotify(userId, deviceId, paddyName, fieldId, fieldName, isOnline, hasNPK);
      });

      unsubscribers.push(unsubscribe);

      // Periodic check every 30 seconds
      const intervalId = setInterval(() => {
        // Re-fetch and check status
        const deviceRef = ref(database, `devices/${deviceId}`);
        onValue(deviceRef, (snapshot) => {
          if (!snapshot.exists()) {
            checkAndNotify(userId, deviceId, paddyName, fieldId, fieldName, false, false);
            return;
          }

          const deviceData = snapshot.val();
          const now = Date.now();

          const hasHeartbeat = deviceData.status === 'connected' || deviceData.status === 'alive';
          
          let hasRecentNPK = false;
          if (deviceData.npk?.timestamp) {
            const npkTimestamp = deviceData.npk.timestamp;
            const npkTime = npkTimestamp < 10000000000 ? npkTimestamp * 1000 : npkTimestamp;
            const timeSinceNPK = now - npkTime;
            hasRecentNPK = timeSinceNPK < OFFLINE_THRESHOLD;
          }

          const isOnline = hasHeartbeat || hasRecentNPK;
          const hasNPK = deviceData.npk && (
            deviceData.npk.n !== undefined || 
            deviceData.npk.p !== undefined || 
            deviceData.npk.k !== undefined
          );

          checkAndNotify(userId, deviceId, paddyName, fieldId, fieldName, isOnline, hasNPK);
        }, { onlyOnce: true });
      }, CHECK_INTERVAL);

      monitorIntervals.push(intervalId);
    });

    return () => {
      unsubscribers.forEach(unsub => unsub());
      monitorIntervals.forEach(interval => clearInterval(interval));
    };
  }, [configs]);

  const checkAndNotify = async (
    userId: string,
    deviceId: string,
    paddyName: string | undefined,
    fieldId: string | undefined,
    fieldName: string | undefined,
    isOnline: boolean,
    hasNPK: boolean
  ) => {
    const lastStatus = lastStatusRef.current[deviceId];
    const notificationSent = notificationSentRef.current[deviceId];

    // Device went offline
    if (lastStatus.online && !isOnline && !notificationSent) {
      console.log(`[Monitor] Device ${deviceId} went offline`);
      await notifyDeviceOffline(userId, deviceId, paddyName, fieldId, fieldName);
      notificationSentRef.current[deviceId] = true;
    }

    // Device came back online
    if (!lastStatus.online && isOnline && notificationSent) {
      console.log(`[Monitor] Device ${deviceId} came back online`);
      await notifyDeviceOnline(userId, deviceId, paddyName, fieldId, fieldName);
      notificationSentRef.current[deviceId] = false;
    }

    // Update last status
    lastStatusRef.current[deviceId] = { online: isOnline, hasNPK };
  };
}
