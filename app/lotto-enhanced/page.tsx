'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function LottoEnhanced() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isOfflineReady, setIsOfflineReady] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Register service worker for offline functionality
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw-lotto-enhanced.js')
        .then((registration) => {
          console.log('Lotto Enhanced SW registered:', registration);
          setIsOfflineReady(true);
        })
        .catch((error) => {
          console.log('Lotto Enhanced SW registration failed:', error);
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
          // Offline mode - use cached user or demo mode
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
          // For now, let's allow access without authentication
          console.log('No user logged in - running in demo mode');
          setUser({ email: 'demo@example.com' });
          setLoading(false);
          return;
        }
        
        // Cache user for offline use
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

    // Listen for auth changes (only when online)
    if (isOnline) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session) {
          localStorage.setItem('lotto-cached-user', JSON.stringify(session.user));
          setUser(session.user);
        }
      });

      return () => subscription.unsubscribe();
    }
  }, [isOnline]);

  useEffect(() => {
    if (!loading && user) {
      // Load the original LOTTO 2_1 scripts after authentication
      loadOriginalLotto();
    }
  }, [loading, user]);

  useEffect(() => {
    // Listen for messages from the iframe
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'toggle-menu') {
        setMenuOpen(!menuOpen);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [menuOpen]);

  const loadOriginalLotto = () => {
    // Pass Supabase credentials to the window object
    (window as any).SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    (window as any).SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    (window as any).IS_OFFLINE = !isOnline;
    
    // We'll inject the original HTML and scripts here
    const container = document.getElementById('lotto-container');
    if (container) {
      // Load the original HTML structure
      const loadLottoContent = async () => {
        try {
          const response = await fetch('/lotto-enhanced/lotto.html');
          if (!response.ok && !isOnline) {
            throw new Error('Offline - using cached content');
          }
          const html = await response.text();
          container.innerHTML = html;
          
          // Add offline indicator to the content
          if (!isOnline) {
            addOfflineIndicator(container);
          }
          
          // Load the enhanced script that connects to Supabase
          const script = document.createElement('script');
          script.src = '/lotto-enhanced/enhanced-script.js';
          script.type = 'module';
          document.body.appendChild(script);
          
          setupScrollHandlers(container);
        } catch (error) {
          console.log('Loading from cache or offline mode');
          // Fallback to basic offline content
          loadOfflineFallback(container);
        }
      };

      loadLottoContent();
    }
  };

  const addOfflineIndicator = (container: HTMLElement) => {
    const offlineIndicator = document.createElement('div');
    offlineIndicator.innerHTML = `
      <div style="
        position: fixed; 
        top: 10px; 
        left: 50%; 
        transform: translateX(-50%); 
        background: rgba(255, 193, 7, 0.95); 
        color: #000; 
        padding: 8px 16px; 
        border-radius: 20px; 
        font-size: 12px; 
        font-weight: 600; 
        z-index: 10000;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      ">
        🔌 OFFLINE MODE - Using cached data
      </div>
    `;
    container.appendChild(offlineIndicator);
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
          <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 12px; margin: 20px 0;">
            <h3>Available Offline:</h3>
            <ul style="list-style: none; padding: 0;">
              <li style="margin: 10px 0;">✓ Cached lottery data</li>
              <li style="margin: 10px 0;">✓ Number frequency analysis</li>
              <li style="margin: 10px 0;">✓ Saved number combinations</li>
            </ul>
          </div>
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
          <a href="/pwa-test" style="
            display: inline-block; 
            background: #007AFF; 
            color: white; 
            padding: 12px 24px; 
            border-radius: 8px; 
            text-decoration: none; 
            font-weight: 600; 
            margin: 10px;
          ">
            📱 PWA Test Page
          </a>
        </div>
      </div>
    `;
  };

  const setupScrollHandlers = (container: HTMLElement) => {
    // Add scroll listener to container
    let lastScrollTop = 0;
    let ticking = false;
    
    const handleContainerScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollTop = container.scrollTop;
          const topNav = container.querySelector('.topNav');
          const hamburgerMenu = container.querySelector('#hamburger-menu');
          
          if (scrollTop > lastScrollTop && scrollTop > 100) {
            // Scrolling down - hide
            if (topNav) topNav.classList.add('hidden');
            if (hamburgerMenu) hamburgerMenu.classList.add('hidden');
          } else {
            // Scrolling up - show
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
    <>
      <style jsx global>{`
        /* Font fallbacks for offline mode */
        @font-face {
          font-family: 'Lexend-fallback';
          src: local('SF Pro Display'), local('Segoe UI'), local('Roboto'), local('Arial'), sans-serif;
          font-display: swap;
        }
        
        /* Override font families to include fallbacks */
        body, .easter-egg, .countdown-timer, .number-button {
          font-family: 'Lexend', 'Lexend-fallback', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, system-ui, sans-serif !important;
        }
        
        .trispace, h1, h2, h3 {
          font-family: 'Trispace', 'Lexend', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, monospace, system-ui, sans-serif !important;
        }
        
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
        
        /* Hide scrollbars but keep functionality */
        #lotto-container::-webkit-scrollbar {
          width: 0;
          height: 0;
          display: none;
        }
        
        #lotto-container {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
        
        #hamburger-menu {
          position: absolute;
          top: 10px;
          right: 20px;
          z-index: 1000;
        }
      `}</style>

      {/* Dropdown menu */}
      {menuOpen && (
        <div style={{
          position: 'fixed',
          top: '60px',
          right: '20px',
          background: 'rgba(15, 15, 15, 0.95)',
          outline: '10px solid rgba(80, 80, 80, 0.25)',
          borderRadius: '16px',
          padding: '20px',
          zIndex: 999,
          width: '250px',
          // boxShadow: '0 4px 20px rgba(41, 41, 41, 0.5)'
        }}>
          <div style={{ color: 'rgb(188, 188, 188)', marginBottom: '15px', fontSize: '14px' }}>
            {user?.email}
          </div>
          
          <div style={{ borderTop: '1px solid rgba(58, 58, 58, 0.3)', paddingTop: '15px' }}>
            {user?.email === 'demo@example.com' ? (
              <>
                <button
                  onClick={() => router.push('/login')}
                  style={{
                    width: '100%',
                    background: 'rgba(24, 24, 24, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    color: '#ffffff',
                    padding: '12px 0',
                    minWidth: '100%',
                    cursor: 'pointer',
                    marginBottom: '10px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'all 0.3s ease',
                    backdropFilter: 'blur(10px)',
                    boxSizing: 'border-box'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'rgba(24, 24, 24, 0.8)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  Login
                </button>
                <button
                  onClick={() => router.push('/signup')}
                  style={{
                    width: '100%',
                    background: 'rgba(24, 24, 24, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    color: '#ffffff',
                    padding: '12px 0',
                    cursor: 'pointer',
                    minWidth: '100%',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '600',
                    transition: 'all 0.3s ease',
              
                    boxSizing: 'border-box'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'rgba(24, 24, 24, 0.8)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  Sign Up
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => router.push('/dashboard')}
                  style={{
                    width: '100%',
                    background: 'none',
                    border: '1px solid #cf0',
                    color: '#cf0',
                    padding: '10px',
                    cursor: 'pointer',
                    marginBottom: '10px',
                    transition: 'all 0.3s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = '#cf0';
                    e.currentTarget.style.color = '#000';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'none';
                    e.currentTarget.style.color = '#cf0';
                  }}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => supabase.auth.signOut()}
                  style={{
                    width: '100%',
                    background: 'none',
                    border: '1px solid #cf0',
                    color: '#cf0',
                    padding: '10px',
                    cursor: 'pointer',
                    transition: 'all 0.3s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = '#cf0';
                    e.currentTarget.style.color = '#000';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'none';
                    e.currentTarget.style.color = '#cf0';
                  }}
                >
                  Sign Out
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Click outside to close menu */}
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
      
      {/* Container for the original LOTTO app */}
      <div id="lotto-container"></div>
    </>
  );
} 