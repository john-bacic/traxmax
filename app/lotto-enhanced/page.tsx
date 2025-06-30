'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function LottoEnhanced() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Check authentication
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // For now, let's allow access without authentication
        console.log('No user logged in - running in demo mode');
        setUser({ email: 'demo@example.com' });
        setLoading(false);
        return;
      }
      setUser(user);
      setLoading(false);
    };

    checkUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

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
    
    // We'll inject the original HTML and scripts here
    const container = document.getElementById('lotto-container');
    if (container) {
      // Load the original HTML structure
      fetch('/lotto-enhanced/lotto.html')
        .then(res => res.text())
        .then(html => {
          container.innerHTML = html;
          
          // Load the enhanced script that connects to Supabase
          const script = document.createElement('script');
          script.src = '/lotto-enhanced/enhanced-script.js';
          script.type = 'module';
          document.body.appendChild(script);
          
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
        });
    }
  };

  if (loading) {
    return <div className="loader"></div>;
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