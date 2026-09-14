'use client';

import { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [showBanner, setShowBanner] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const updateStatus = () => {
      setIsOnline(navigator.onLine);
      if (!navigator.onLine) {
        setShowBanner(true);
      }
    };
    updateStatus();
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
    };
  }, []);

  // Hide banner after going online
  useEffect(() => {
    if (isOnline && showBanner) {
      const timer = setTimeout(() => setShowBanner(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, showBanner]);

  if (!showBanner) return null;

  return (
    <div className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${isOnline ? 'bg-green-500' : 'bg-orange-500'}`}>
      <div className="max-w-2xl mx-auto px-4 py-2.5 flex items-center justify-center space-x-2 text-white text-sm font-medium">
        {isOnline ? (
          <>
            <Wifi className="h-4 w-4" />
            <span>Connexion rétablie</span>
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4" />
            <span>Mode hors ligne — les modifications seront synchronisées</span>
          </>
        )}
      </div>
    </div>
  );
}