'use client';
import { useEffect, useState } from 'react';

export default function PWATest() {
  const [isOnline, setIsOnline] = useState(true);
  const [isInstallable, setIsInstallable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    setIsInstalled(window.matchMedia('(display-mode: standalone)').matches);

    // Online/offline detection
    setIsOnline(navigator.onLine);
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // PWA installation prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw-pwa-test.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration);
        })
        .catch((error) => {
          console.log('Service Worker registration failed:', error);
        });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to the install prompt: ${outcome}`);
      setDeferredPrompt(null);
      setIsInstallable(false);
    }
  };

  const toggleOnlineMode = () => {
    // Simulate offline mode for testing
    if (isOnline) {
      // Force offline mode
      setIsOnline(false);
    } else {
      setIsOnline(navigator.onLine);
    }
  };

  return (
    <div className="pwa-container">
      <style jsx global>{`
        .pwa-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .pwa-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 30px;
          margin: 20px auto;
          max-width: 400px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        }
        
        .status-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 15px;
          border-radius: 12px;
          margin: 20px 0;
          font-weight: 600;
          font-size: 16px;
        }
        
        .online {
          background: #d4edda;
          color: #155724;
          border: 2px solid #c3e6cb;
        }
        
        .offline {
          background: #f8d7da;
          color: #721c24;
          border: 2px solid #f5c6cb;
        }
        
        .install-btn, .test-btn {
          width: 100%;
          padding: 15px;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          margin: 10px 0;
          transition: all 0.3s ease;
        }
        
        .install-btn {
          background: #007AFF;
          color: white;
        }
        
        .install-btn:hover {
          background: #0051D5;
          transform: translateY(-2px);
        }
        
        .install-btn:disabled {
          background: #ccc;
          cursor: not-allowed;
          transform: none;
        }
        
        .test-btn {
          background: #34C759;
          color: white;
        }
        
        .test-btn:hover {
          background: #28A745;
          transform: translateY(-2px);
        }
        
        .offline-content {
          text-align: center;
          padding: 20px;
        }
        
        .feature-list {
          list-style: none;
          padding: 0;
        }
        
        .feature-list li {
          padding: 10px 0;
          border-bottom: 1px solid #eee;
          display: flex;
          align-items: center;
        }
        
        .feature-list li:before {
          content: "✓";
          color: #34C759;
          font-weight: bold;
          margin-right: 10px;
        }
        
        .ios-install-guide {
          background: #f8f9fa;
          border-radius: 12px;
          padding: 20px;
          margin: 20px 0;
        }
        
        .ios-install-guide h3 {
          margin-top: 0;
          color: #333;
        }
        
        .ios-install-guide ol {
          padding-left: 20px;
        }
        
        .ios-install-guide li {
          margin: 8px 0;
          line-height: 1.5;
        }

        @media (display-mode: standalone) {
          .pwa-container {
            padding-top: 50px; /* Account for status bar */
          }
        }
      `}</style>

      <div className="pwa-card">
        <h1 style={{ textAlign: 'center', margin: '0 0 20px 0', color: '#333' }}>
          📱 PWA Test App
        </h1>

        <div className={`status-indicator ${isOnline ? 'online' : 'offline'}`}>
          {isOnline ? '🟢 Online Mode' : '🔴 Offline Mode'}
        </div>

        {isInstalled && (
          <div className="status-indicator online">
            ✅ App is installed and running in standalone mode!
          </div>
        )}

        {isInstallable && (
          <button className="install-btn" onClick={handleInstall}>
            📲 Install App
          </button>
        )}

        <button className="test-btn" onClick={toggleOnlineMode}>
          {isOnline ? 'Test Offline Mode' : 'Test Online Mode'}
        </button>

        {!isOnline && (
          <div className="offline-content">
            <h2>🚫 No Internet Connection</h2>
            <p>You're now in offline mode! This app still works without internet.</p>
            
            <h3>📋 Offline Features Available:</h3>
            <ul className="feature-list">
              <li>View cached content</li>
              <li>Use local storage data</li>
              <li>Basic app functionality</li>
              <li>Lotto number generator</li>
              <li>Saved numbers history</li>
            </ul>
          </div>
        )}

        {isOnline && (
          <div>
            <h3>✨ PWA Features:</h3>
            <ul className="feature-list">
              <li>Offline functionality</li>
              <li>Home screen installation</li>
              <li>Push notifications ready</li>
              <li>Fast loading with caching</li>
              <li>Native app experience</li>
            </ul>
          </div>
        )}

        <div className="ios-install-guide">
          <h3>📱 Install on iPhone:</h3>
          <ol>
            <li>Open this page in Safari</li>
            <li>Tap the Share button (📤) at the bottom</li>
            <li>Scroll down and tap "Add to Home Screen"</li>
            <li>Tap "Add" in the top right</li>
            <li>The app icon will appear on your home screen</li>
          </ol>
        </div>

        <div style={{ textAlign: 'center', marginTop: 30, display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center' }}>
          <a 
            href="/lotto-enhanced" 
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              background: '#FF9500',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              width: '200px',
              textAlign: 'center'
            }}
          >
            🎰 Full Lotto Game
          </a>
          
          <a 
            href="/pwa-test/offline-lotto" 
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              background: '#34C759',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              width: '200px',
              textAlign: 'center'
            }}
          >
            🔌 Offline Lotto (1-50)
          </a>
        </div>
      </div>
    </div>
  );
} 