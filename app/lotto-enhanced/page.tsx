'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

// Error Boundary Component
function ErrorBoundary({ children, fallback }: { children: React.ReactNode, fallback: React.ReactNode }) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error('Error caught by boundary:', error);
      setHasError(true);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      setHasError(true);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  if (hasError) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

export default function LottoEnhanced() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isOfflineReady, setIsOfflineReady] = useState(false);
  const [lottoLoaded, setLottoLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [gitInfo, setGitInfo] = useState<{commit: string, branch: string}>({commit: 'loading...', branch: 'loading...'});
  const router = useRouter();
  const supabase = createClient();

  // Error fallback component
  const ErrorFallback = () => (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
      color: 'white',
      padding: '20px',
      textAlign: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{ maxWidth: '500px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '20px', color: '#CCFF00' }}>⚠️ Something went wrong</h1>
        <p style={{ marginBottom: '30px', opacity: 0.8, lineHeight: '1.5' }}>
          The lotto tracker encountered an error. This usually happens due to a loading issue.
        </p>
        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#CCFF00',
              color: '#000',
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            🔄 Refresh Page
          </button>
          <button
            onClick={() => router.push('/')}
            style={{
              background: '#7E68CF',
              color: '#fff',
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            🏠 Go Home
          </button>
          <button
            onClick={() => router.push('/pwa-test/offline-lotto')}
            style={{
              background: '#FF6B6B',
              color: '#fff',
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            🎯 Offline Lotto
          </button>
        </div>
      </div>
    </div>
  );

  useEffect(() => {
    // Global error handlers
    const handleError = (error: ErrorEvent) => {
      console.error('Global error:', error);
      if (error.message.includes('Script error') || error.message.includes('Loading')) {
        setHasError(true);
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled rejection:', event.reason);
      if (event.reason?.message?.includes('Loading') || event.reason?.message?.includes('fetch')) {
        setHasError(true);
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  useEffect(() => {
    // Register service worker for offline functionality
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw-lotto-enhanced.js')
        .then((registration) => {
          console.log('✅ Lotto Enhanced SW registered:', registration);
          
          if (registration.active) {
            console.log('🔄 Service worker active, cache should be ready');
            setIsOfflineReady(true);
          } else {
            console.log('⏳ Service worker installing, waiting for activation...');
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'activated') {
                    console.log('✅ Service worker activated, cache ready');
                    setIsOfflineReady(true);
                  }
                });
              }
            });
          }
        })
        .catch((error) => {
          console.error('❌ Lotto Enhanced SW registration failed:', error);
        });
    }

    // Online/offline detection
    setIsOnline(navigator.onLine);
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    // Check authentication
    const checkUser = async () => {
      try {
        if (!isOnline) {
          const cachedUser = localStorage.getItem('lotto-cached-user');
          if (cachedUser) {
            setUser(JSON.parse(cachedUser));
          } else {
            setUser({ email: 'offline@demo.com', offline: true });
          }
          setLoading(false);
          return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.log('No user logged in - running in demo mode');
          setUser({ email: 'demo@example.com' });
          setLoading(false);
          return;
        }
        
        localStorage.setItem('lotto-cached-user', JSON.stringify(user));
        setUser(user);
        setLoading(false);
      } catch (error) {
        console.log('Auth check failed, using offline mode');
        setUser({ email: 'offline@demo.com', offline: true });
        setLoading(false);
      }
    };

    checkUser();

    if (navigator.onLine) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session) {
          localStorage.setItem('lotto-cached-user', JSON.stringify(session.user));
          setUser(session.user);
        }
      });

      return () => subscription.unsubscribe();
    }
  }, []);

  useEffect(() => {
    if (!loading && user && !lottoLoaded && !hasError) {
      // Add a small delay to ensure DOM is ready
      setTimeout(() => {
        try {
          loadOriginalLotto();
          setLottoLoaded(true);
        } catch (error) {
          console.error('Error loading lotto:', error);
          setHasError(true);
        }
      }, 100);
    }
  }, [loading, user, lottoLoaded, hasError]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'toggle-menu') {
        setMenuOpen(!menuOpen);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [menuOpen]);

  useEffect(() => {
    const fetchGitInfo = async () => {
      try {
        console.log('🔍 Fetching Git info...');
        const response = await fetch('/api/git-info');
        const result = await response.json();
        if (result.success) {
          setGitInfo(result.data);
        } else {
          setGitInfo({commit: 'unknown', branch: 'unknown'});
        }
      } catch (error) {
        console.error('❌ Failed to fetch Git info:', error);
        setGitInfo({commit: 'error', branch: 'error'});
      }
    };

    fetchGitInfo();
  }, []);

  const handleCacheRefresh = async () => {
    try {
      console.log('🔄 Starting cache refresh...');
      
      // Clear all possible caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => {
            console.log('🗑️ Deleting cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
      }
      
      // Clear service worker cache and update
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          console.log('🔄 Updating service worker...');
          await registration.update();
          
          // Force reload if new worker is available
          if (registration.waiting) {
            registration.waiting.postMessage({ action: 'skipWaiting' });
          }
        }
      }
      
      // Clear localStorage and sessionStorage
      localStorage.clear();
      sessionStorage.clear();
      
      console.log('✅ Cache refresh complete, reloading...');
      
      // Force refresh with cache bypass
      window.location.reload();
      
    } catch (error) {
      console.error('❌ Cache refresh failed:', error);
      // Fallback: simple reload
      window.location.reload();
    }
  };

  const loadOriginalLotto = () => {
    console.log('🔄 loadOriginalLotto called');
    
    try {
      (window as any).SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://slyscrmgrrjzzclbbdia.supabase.co';
      (window as any).SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNseXNjcm1ncnJqenpjbGJiZGlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMzA5MTQsImV4cCI6MjA2NjcwNjkxNH0.5F3Jk0pesBHAwFaBpuZuSucbecRvniFokkmMICWPfQc';
      
      const container = document.getElementById('lotto-container');
      if (!container) {
        throw new Error('Lotto container not found');
      }

      const loadLottoContent = async () => {
        try {
          const response = await fetch('/lotto-enhanced/lotto.html');
          if (!response.ok && !navigator.onLine) {
            throw new Error('Offline - using cached content');
          }
          const html = await response.text();
          
          // Safely set innerHTML with error handling
          if (container) {
            container.innerHTML = html;
            
            // Clean up existing scripts
            const existingMainScripts = document.querySelectorAll('script[src*="/lotto-enhanced/script.js"]');
            existingMainScripts.forEach(script => script.remove());
            
            const existingDataScripts = document.querySelectorAll('script[src*="/lotto-enhanced/data.js"]');
            existingDataScripts.forEach(script => script.remove());
            
            if ((window as any).lottoMaxWinningNumbers2023) {
              delete (window as any).lottoMaxWinningNumbers2023;
            }
            
            // Load scripts in sequence with error handling
            loadScriptsSequence(container);
          }
        } catch (error) {
          console.log('Loading from cache or offline mode');
          loadOfflineFallback(container);
        }
      };

      loadLottoContent();
    } catch (error) {
      console.error('Error in loadOriginalLotto:', error);
      setHasError(true);
    }
  };

  const loadScriptsSequence = (container: HTMLElement) => {
    console.log('📥 Loading Supabase CDN...');
    const supabaseScript = document.createElement('script');
    supabaseScript.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.7/dist/umd/supabase.min.js';
    supabaseScript.onload = () => {
      console.log('✅ Supabase CDN loaded successfully');
      
      console.log('📥 Loading data manager...');
      const dataManagerScript = document.createElement('script');
      dataManagerScript.src = `/lib/supabase/data-manager.js?t=${Date.now()}`;
      dataManagerScript.type = 'module';
      dataManagerScript.onload = () => {
        console.log('✅ Data manager loaded successfully');
        
        console.log('📥 Loading fresh data.js');
        const dataScript = document.createElement('script');
        dataScript.src = `/lotto-enhanced/data.js?t=${Date.now()}`;
        dataScript.type = 'module';
        dataScript.onload = () => {
          console.log('✅ Data script loaded successfully');
        
          console.log('📥 Loading fresh script.js');
          const mainScript = document.createElement('script');
          mainScript.src = `/lotto-enhanced/script.js?t=${Date.now()}`;
          mainScript.type = 'module';
          mainScript.onload = () => {
            console.log('✅ Main script loaded successfully');
            console.log('🎯 All scripts loaded - data manager ready!');
            setupScrollHandlers(container);
          };
          mainScript.onerror = (error) => {
            console.error('❌ Main script failed to load:', error);
            setHasError(true);
          };
          document.body.appendChild(mainScript);
        };
        dataScript.onerror = (error) => {
          console.error('❌ Data script failed to load:', error);
          setHasError(true);
        };
        document.body.appendChild(dataScript);
      };
      dataManagerScript.onerror = (error) => {
        console.error('❌ Data manager script failed to load:', error);
        setHasError(true);
      };
      document.body.appendChild(dataManagerScript);
    };
    supabaseScript.onerror = (error) => {
      console.error('❌ Supabase CDN failed to load:', error);
      setHasError(true);
    };
    document.body.appendChild(supabaseScript);
  };

  const loadOfflineFallback = (container: HTMLElement) => {
    container.innerHTML = `
      <div style="
        min-height: 100vh; 
        background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); 
        color: white; 
        padding: 20px; 
        text-align: center; 
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      ">
        <div style="max-width: 400px; margin: 50px auto;">
          <h1 style="font-size: 2rem; margin-bottom: 20px;">🔌 Offline Mode</h1>
          <p style="margin-bottom: 30px; opacity: 0.8;">
            You're currently offline. The full lotto tracker requires an internet connection.
          </p>
          <a href="/pwa-test/offline-lotto" style="
            display: inline-block; 
            background: #FFD700; 
            color: #000; 
            padding: 12px 24px; 
            border-radius: 8px; 
            text-decoration: none; 
            font-weight: 600; 
            margin: 10px;
          ">
            🎯 Use Offline Lotto Generator
          </a>
        </div>
      </div>
    `;
  };

  const setupScrollHandlers = (container: HTMLElement) => {
    let lastScrollTop = 0;
    let ticking = false;
    
    const handleContainerScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollTop = container.scrollTop;
          const topNav = container.querySelector('.topNav');
          const hamburgerMenu = container.querySelector('#hamburger-menu');
          
          if (scrollTop > lastScrollTop && scrollTop > 100) {
            if (topNav) topNav.classList.add('hidden');
            if (hamburgerMenu) hamburgerMenu.classList.add('hidden');
          } else {
            if (topNav) topNav.classList.remove('hidden');
            if (hamburgerMenu) hamburgerMenu.classList.remove('hidden');
          }
          
          lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
          ticking = false;
        });
        ticking = true;
      }
    };
    
    container.addEventListener('scroll', handleContainerScroll);
  };

  if (hasError) {
    return <ErrorFallback />;
  }

  if (loading) {
    return (
      <div className="loader" style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#000',
        color: '#fff'
      }}>
        <div>Loading Lotto Enhanced...</div>
      </div>
    );
  }

  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      <style jsx global>{`
        html, body {
          overflow: hidden;
          height: 100%;
          margin: 0;
          padding: 0;
        }
        
        #lotto-container {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          overflow-y: auto;
          overflow-x: hidden;
          -webkit-overflow-scrolling: touch;
        }
        
        #lotto-container::-webkit-scrollbar {
          width: 0;
          height: 0;
          display: none;
        }
        
        #lotto-container {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        #hamburger-menu {
          position: absolute;
          top: 10px;
          right: 20px;
          z-index: 1000;
        }
      `}</style>

      {menuOpen && (
        <div className="hamburger-menu-container">
          <div className="hamburger-menu-email">
            {user?.email}
          </div>
          
          <div className="hamburger-menu-divider">
            {user?.email === 'demo@example.com' ? (
              <>
                <button 
                  onClick={() => router.push('/login')} 
                  className="hamburger-menu-button hamburger-menu-button--auth"
                >
                  Login
                </button>
                <button 
                  onClick={() => router.push('/signup')} 
                  className="hamburger-menu-button hamburger-menu-button--auth"
                >
                  Sign Up
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => router.push('/dashboard')} 
                  className="hamburger-menu-button hamburger-menu-button--dashboard"
                >
                  Dashboard
                </button>
                <button 
                  onClick={() => supabase.auth.signOut()} 
                  className="hamburger-menu-button hamburger-menu-button--dashboard"
                >
                  Sign Out
                </button>
              </>
            )}
            
            <button 
              onClick={() => router.push('/pwa-test/analytics')} 
              className="hamburger-menu-button hamburger-menu-button--analytics"
            >
              📊 View Number Analytics
            </button>

            <button 
              onClick={() => router.push('/game')} 
              className="hamburger-menu-button hamburger-menu-button--game"
            >
              🎮 Play Game
            </button>
            
            <div className="hamburger-menu-footer">
              <div style={{ marginBottom: '4px', display: 'flex', alignItems: 'center' }}>
                <button
                  onClick={handleCacheRefresh}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '4px',
                    marginRight: '8px'
                  }}
                  title="Clear cache and refresh"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#CCFF00">
                    <path d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
                  </svg>
                </button>
                <span>
                  Build: <span style={{ fontFamily: 'monospace', color: '#CCFF00' }}>{gitInfo.commit}</span>
                </span>
              </div>
              <div style={{ paddingLeft: '32px' }}>
                Branch: <span style={{ fontFamily: 'monospace', color: '#CCFF00' }}>{gitInfo.branch}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {menuOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 998
          }}
          onClick={() => setMenuOpen(false)}
        />
      )}
      
      <div id="lotto-container"></div>
    </ErrorBoundary>
  );
} 