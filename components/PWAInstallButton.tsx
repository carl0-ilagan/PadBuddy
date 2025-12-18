'use client';

import { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if user previously dismissed the prompt (for this session only)
    const dismissed = sessionStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      setIsDismissed(true);
      return;
    }

    // Check if app is already installed (standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = (window.navigator as any).standalone === true;
    
    if (isStandalone || isIOSStandalone) {
      setIsInstalled(true);
      setShowButton(false);
      return;
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowButton(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if app was just installed
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowButton(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    await deferredPrompt.prompt();

    // Wait for user response
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstalled(true);
      setShowButton(false);
    }

    // Clear the prompt
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowButton(false);
    setIsDismissed(true);
    // Remember dismissal for this session only
    sessionStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (!showButton || isInstalled || isDismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-modal-popup lg:hidden">
      <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-green-200 p-4 flex items-center gap-4">
        <div className="flex-shrink-0">
          <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
            <Smartphone className="h-7 w-7 text-white" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 text-base" style={{ fontFamily: "'Courier New', Courier, monospace" }}>
            Install PadBuddy
          </h3>
          <p className="text-xs text-gray-600">
            I-install para mas mabilis at offline access!
          </p>
        </div>
        <div className="flex flex-col gap-2 flex-shrink-0">
          <button
            onClick={handleInstallClick}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-sm font-bold px-4 py-2 rounded-xl shadow-lg transition-all active:scale-95"
            style={{ fontFamily: "'Courier New', Courier, monospace" }}
          >
            <Download className="h-4 w-4" />
            Install
          </button>
        </div>
        <button
          onClick={handleDismiss}
          className="absolute -top-2 -right-2 p-1.5 rounded-full bg-white shadow-lg hover:bg-gray-100 transition-all border border-gray-200"
        >
          <X className="h-4 w-4 text-gray-500" />
        </button>
      </div>
    </div>
  );
}


