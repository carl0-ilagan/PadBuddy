'use client';

import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePushNotifications } from '@/lib/hooks/usePushNotifications';

export default function PushNotificationSetup() {
  const { user } = useAuth();
  const { isSupported, permission, requestPermission } = usePushNotifications();

  useEffect(() => {
    if (!user || !isSupported) return;

    // Auto-request permission if not yet requested (only once)
    const permissionRequested = localStorage.getItem('notification-permission-requested');
    
    if (!permissionRequested && permission === 'default') {
      // Don't auto-request, let user click a button instead
      // This is better UX - we'll add a prompt in the notification bell
      console.log('Push notifications available but permission not yet requested');
    } else if (permission === 'granted') {
      // Permission already granted, token will be fetched automatically by the hook
      console.log('Push notifications enabled');
    }
  }, [user, isSupported, permission, requestPermission]);

  // This component doesn't render anything
  return null;
}
