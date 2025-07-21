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
  const [lottoLoaded, setLottoLoaded] = useState(false);
  const [gitInfo, setGitInfo] = useState<{commit: string, branch: string}>({commit: 'loading...', branch: 'loading...'});
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Register service worker for offline functionality
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw-lotto-enhanced.js')
        .then((registration) => {
          console.log('✅ Lotto Enhanced SW registered:', registration);
          
          // Force cache update on Vercel to ensure data.js is cached
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
    if (navigator.onLine) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session) {
          localStorage.setItem('lotto-cached-user', JSON.stringify(session.user));
          setUser(session.user);
        }
      });

      return () => subscription.unsubscribe();
    }
  }, []); // Remove isOnline dependency to prevent re-renders on offline/online

  useEffect(() => {
    if (!loading && user && !lottoLoaded) {
      // Load the original LOTTO 2_1 scripts after authentication
      loadOriginalLotto();
      setLottoLoaded(true);
    }
  }, [loading, user, lottoLoaded]);

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

  // Fetch Git info when component mounts
  useEffect(() => {
    const fetchGitInfo = async () => {
      try {
        console.log('🔍 Fetching Git info...');
        const response = await fetch('/api/git-info');
        console.log('📡 Git info response status:', response.status);
        const result = await response.json();
        console.log('📊 Git info result:', result);
        if (result.success) {
          console.log('✅ Setting Git info:', result.data);
          setGitInfo(result.data);
        } else {
          console.warn('⚠️ Git info failed, using unknown');
          setGitInfo({commit: 'unknown', branch: 'unknown'});
        }
      } catch (error) {
        console.error('❌ Failed to fetch Git info:', error);
        setGitInfo({commit: 'error', branch: 'error'});
      }
    };

    fetchGitInfo();
  }, []);

  const loadOriginalLotto = () => {
    console.log('🔄 loadOriginalLotto called');
    console.log('📊 Current DOM state:');
    console.log('  - Enhanced scripts in DOM:', document.querySelectorAll('script[src*="enhanced-script.js"]').length);
    console.log('  - Data scripts in DOM:', document.querySelectorAll('script[src*="data.js"]').length);
    console.log('  - window.lottoMaxWinningNumbers2023 exists:', !!(window as any).lottoMaxWinningNumbers2023);
    console.log('  - localStorage cache exists:', !!localStorage.getItem('lotto-cached-data'));
    
    // Pass Supabase credentials to the window object
    // Fallback to hardcoded values if env vars aren't loaded
    (window as any).SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://slyscrmgrrjzzclbbdia.supabase.co';
    (window as any).SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNseXNjcm1ncnJqenpjbGJiZGlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMzA5MTQsImV4cCI6MjA2NjcwNjkxNH0.5F3Jk0pesBHAwFaBpuZuSucbecRvniFokkmMICWPfQc';
    
    console.log('🔧 Supabase credentials set:', {
      url: (window as any).SUPABASE_URL,
      keyPreview: (window as any).SUPABASE_ANON_KEY?.substring(0, 20) + '...'
    });
    
    // We'll inject the original HTML and scripts here
    const container = document.getElementById('lotto-container');
    if (container) {
      // Load the original HTML structure
      const loadLottoContent = async () => {
        try {
          const response = await fetch('/lotto-enhanced/lotto.html');
          if (!response.ok && !navigator.onLine) {
            throw new Error('Offline - using cached content');
          }
          const html = await response.text();
          container.innerHTML = html;
          
          // Offline indicator is now handled by the SVG icon in topNav
          // Let the enhanced-script.js handle its own offline detection
          
          // Clean up any existing enhanced scripts to ensure fresh load after navigation
          const existingEnhancedScripts = document.querySelectorAll('script[src*="/lotto-enhanced/enhanced-script.js"]');
          console.log('🧹 Removing existing enhanced-script.js instances:', existingEnhancedScripts.length);
          existingEnhancedScripts.forEach(script => script.remove());
          
          // Also clean up any data.js scripts from previous sessions
          const existingDataScripts = document.querySelectorAll('script[src*="/lotto-enhanced/data.js"]');
          console.log('🧹 Removing existing data.js instances:', existingDataScripts.length);
          existingDataScripts.forEach(script => script.remove());
          
          // Clear any window data from previous sessions
          if ((window as any).lottoMaxWinningNumbers2023) {
            console.log('🧹 Clearing existing window.lottoMaxWinningNumbers2023');
            delete (window as any).lottoMaxWinningNumbers2023;
          }
          
          // Always load fresh enhanced script for proper initialization
          console.log('📥 Loading fresh enhanced-script.js');
          const script = document.createElement('script');
          script.src = `/lotto-enhanced/enhanced-script.js?t=${Date.now()}`;
          script.type = 'module';
          script.onload = () => {
            console.log('✅ Enhanced script loaded successfully');
          };
          script.onerror = (error) => {
            console.error('❌ Enhanced script failed to load:', error);
          };
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
            
            {/* Analytics link for all users */}
            <button
              onClick={() => router.push('/pwa-test/analytics')}
              style={{
                width: '100%',
                background: 'rgba(25, 118, 210, 0.8)',
                border: '1px solid rgba(25, 118, 210, 0.5)',
                color: '#ffffff',
                padding: '12px 0',
                minWidth: '100%',
                cursor: 'pointer',
                marginTop: '10px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.3s ease',
                backdropFilter: 'blur(10px)',
                boxSizing: 'border-box'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(25, 118, 210, 1)';
                e.currentTarget.style.borderColor = 'rgba(25, 118, 210, 0.8)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(25, 118, 210, 0.8)';
                e.currentTarget.style.borderColor = 'rgba(25, 118, 210, 0.5)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              📊 View Number Analytics
            </button>

            {/* Game link for all users - positioned last */}
            <button
              onClick={() => router.push('/game')}
              style={{
                width: '100%',
                background: 'rgba(126, 104, 207, 0.8)',
                border: '1px solid rgba(126, 104, 207, 0.5)',
                color: '#ffffff',
                padding: '12px 0',
                minWidth: '100%',
                cursor: 'pointer',
                marginTop: '10px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.3s ease',
                backdropFilter: 'blur(10px)',
                boxSizing: 'border-box'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(126, 104, 207, 1)';
                e.currentTarget.style.borderColor = 'rgba(126, 104, 207, 0.8)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(126, 104, 207, 0.8)';
                e.currentTarget.style.borderColor = 'rgba(126, 104, 207, 0.5)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              🎮 Play Game
            </button>
            
            {/* Git build info */}
            <div style={{
              marginTop: '15px',
              paddingTop: '15px',
              borderTop: '1px solid rgba(58, 58, 58, 0.3)',
              fontSize: '11px',
              color: 'rgba(188, 188, 188, 0.8)',
              textAlign: 'center'
            }}>
              <div style={{ marginBottom: '4px' }}>
                Build: <span style={{ fontFamily: 'monospace', color: '#CCFF00' }}>{gitInfo.commit}</span>
              </div>
              <div>
                Branch: <span style={{ fontFamily: 'monospace', color: '#CCFF00' }}>{gitInfo.branch}</span>
              </div>
            </div>
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