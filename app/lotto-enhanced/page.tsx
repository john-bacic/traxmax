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
    if (!loading && user && !lottoLoaded) {
      loadOriginalLotto();
      setLottoLoaded(true);
    }
  }, [loading, user, lottoLoaded]);

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

  const loadOriginalLotto = () => {
    console.log('🔄 loadOriginalLotto called');
    
    (window as any).SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://slyscrmgrrjzzclbbdia.supabase.co';
    (window as any).SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNseXNjcm1ncnJqenpjbGJiZGlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMzA5MTQsImV4cCI6MjA2NjcwNjkxNH0.5F3Jk0pesBHAwFaBpuZuSucbecRvniFokkmMICWPfQc';
    
    const container = document.getElementById('lotto-container');
    if (container) {
      const loadLottoContent = async () => {
        try {
          const response = await fetch('/lotto-enhanced/lotto.html');
          if (!response.ok && !navigator.onLine) {
            throw new Error('Offline - using cached content');
          }
          const html = await response.text();
          container.innerHTML = html;
          
          // Clean up existing scripts
          const existingMainScripts = document.querySelectorAll('script[src*="/lotto-enhanced/script.js"]');
          existingMainScripts.forEach(script => script.remove());
          
          const existingDataScripts = document.querySelectorAll('script[src*="/lotto-enhanced/data.js"]');
          existingDataScripts.forEach(script => script.remove());
          
          if ((window as any).lottoMaxWinningNumbers2023) {
            delete (window as any).lottoMaxWinningNumbers2023;
          }
          
          // Load scripts in sequence: Supabase CDN → Data Manager → Data.js → Script.js
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
                };
                mainScript.onerror = (error) => {
                  console.error('❌ Main script failed to load:', error);
                };
                document.body.appendChild(mainScript);
              };
              dataScript.onerror = (error) => {
                console.error('❌ Data script failed to load:', error);
              };
              document.body.appendChild(dataScript);
            };
            dataManagerScript.onerror = (error) => {
              console.error('❌ Data manager script failed to load:', error);
            };
            document.body.appendChild(dataManagerScript);
          };
          supabaseScript.onerror = (error) => {
            console.error('❌ Supabase CDN failed to load:', error);
          };
          document.body.appendChild(supabaseScript);
          
          setupScrollHandlers(container);
        } catch (error) {
          console.log('Loading from cache or offline mode');
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
        }}>
          <div style={{ color: 'rgb(188, 188, 188)', marginBottom: '15px', fontSize: '14px' }}>
            {user?.email}
          </div>
          
          <div style={{ borderTop: '1px solid rgba(58, 58, 58, 0.3)', paddingTop: '15px' }}>
            {user?.email === 'demo@example.com' ? (
              <>
                <button onClick={() => router.push('/login')} style={{
                  width: '100%', background: 'rgba(24, 24, 24, 0.8)', border: '1px solid rgba(255, 255, 255, 0.3)',
                  color: '#ffffff', padding: '12px 0', cursor: 'pointer', marginBottom: '10px', borderRadius: '6px',
                  fontSize: '14px', fontWeight: '500', transition: 'all 0.3s ease', boxSizing: 'border-box'
                }}>Login</button>
                <button onClick={() => router.push('/signup')} style={{
                  width: '100%', background: 'rgba(24, 24, 24, 0.8)', border: '1px solid rgba(255, 255, 255, 0.3)',
                  color: '#ffffff', padding: '12px 0', cursor: 'pointer', borderRadius: '6px',
                  fontSize: '14px', fontWeight: '600', transition: 'all 0.3s ease', boxSizing: 'border-box'
                }}>Sign Up</button>
              </>
            ) : (
              <>
                <button onClick={() => router.push('/dashboard')} style={{
                  width: '100%', background: 'none', border: '1px solid #cf0', color: '#cf0',
                  padding: '10px', cursor: 'pointer', marginBottom: '10px', transition: 'all 0.3s'
                }}>Dashboard</button>
                <button onClick={() => supabase.auth.signOut()} style={{
                  width: '100%', background: 'none', border: '1px solid #cf0', color: '#cf0',
                  padding: '10px', cursor: 'pointer', transition: 'all 0.3s'
                }}>Sign Out</button>
              </>
            )}
            
            <button onClick={() => router.push('/pwa-test/analytics')} style={{
              width: '100%', background: 'rgba(25, 118, 210, 0.8)', border: '1px solid rgba(25, 118, 210, 0.5)',
              color: '#ffffff', padding: '12px 0', cursor: 'pointer', marginTop: '10px', borderRadius: '6px',
              fontSize: '14px', fontWeight: '500', transition: 'all 0.3s ease', boxSizing: 'border-box'
            }}>📊 View Number Analytics</button>

            <button onClick={() => router.push('/game')} style={{
              width: '100%', background: 'rgba(126, 104, 207, 0.8)', border: '1px solid rgba(126, 104, 207, 0.5)',
              color: '#ffffff', padding: '12px 0', cursor: 'pointer', marginTop: '10px', borderRadius: '6px',
              fontSize: '14px', fontWeight: '500', transition: 'all 0.3s ease', boxSizing: 'border-box'
            }}>🎮 Play Game</button>
            
            <div style={{
              marginTop: '15px', paddingTop: '15px', borderTop: '1px solid rgba(58, 58, 58, 0.3)',
              fontSize: '11px', color: 'rgba(188, 188, 188, 0.8)', textAlign: 'center'
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
    </>
  );
} 