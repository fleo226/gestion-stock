'use client';

import { useState, useEffect } from 'react';

interface PWAInstallerProps {
  children: React.ReactNode;
}

export function PWAInstaller({ children }: PWAInstallerProps) {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Vérifier si l'application est déjà installée
    const isAppInstalled = () => {
      return window.matchMedia('(display-mode: standalone)').matches ||
             window.matchMedia('(display-mode: fullscreen)').matches ||
             document.referrer.includes('android-app://') ||
             (window.navigator as any).standalone === true;
    };

    if (isAppInstalled()) {
      setIsInstalled(true);
      return;
    }

    // Écouter l'événement beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    // Vérifier si l'application a été installée
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    // Vérifier les changements de mode d'affichage
    const handleDisplayModeChange = () => {
      setIsInstalled(isAppInstalled());
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('displaymodechanged', handleDisplayModeChange);

    // Vérifier le statut initial
    setIsInstalled(isAppInstalled());

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('displaymodechanged', handleDisplayModeChange);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      // Afficher la boîte de dialogue d'installation
      deferredPrompt.prompt();
      
      // Attendre que l'utilisateur réponde
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('L\'utilisateur a accepté l\'installation');
      } else {
        console.log('L\'utilisateur a refusé l\'installation');
      }
      
      // Réinitialiser le deferredPrompt
      setDeferredPrompt(null);
      setIsInstallable(false);
    } catch (error) {
      console.error('Erreur lors de l\'installation:', error);
    }
  };

  const handleSkipInstall = () => {
    setIsInstallable(false);
    setDeferredPrompt(null);
  };

  if (!isInstallable || isInstalled) {
    return <>{children}</>;
  }

  return (
    <>
      {children}
      
      {/* Barre d'installation PWA */}
      <div className="fixed bottom-4 right-4 z-50">
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-gray-900">Installer Ma Boutique</h3>
              <p className="text-xs text-gray-600 mt-1">
                Installez l'application pour un accès rapide et hors ligne
              </p>
            </div>
          </div>
          
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleInstall}
              className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              Installer
            </button>
            <button
              onClick={handleSkipInstall}
              className="px-3 py-2 text-gray-600 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Plus tard
            </button>
          </div>
        </div>
      </div>
    </>
  );
}