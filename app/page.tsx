'use client';

import Link from "next/link";

export default function Home() {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#0a0a0a',
      color: '#ffffff'
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '1rem', 
        marginBottom: '3rem' 
      }}>
        <h1 style={{ fontSize: '3rem', margin: 0 }}>TraxMax</h1>
        <button
          onClick={handleRefresh}
          style={{
            padding: '0.5rem',
            backgroundColor: '#333333',
            color: '#ffffff',
            border: '1px solid #555555',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '1.2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '40px',
            height: '40px',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#555555';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#333333';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          title="Refresh page"
        >
          ↻
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center' }}>
        <Link 
          href="/game" 
          style={{
            padding: '1rem 2rem',
            backgroundColor: '#CCFF00',
            color: '#000000',
            borderRadius: '8px',
            fontSize: '1.2rem',
            fontWeight: '500',
            textAlign: 'center',
            width: '200px'
          }}
        >
          Play Guessing Game
        </Link>
        <Link 
          href="/lotto-enhanced" 
          style={{
            padding: '1rem 2rem',
            backgroundColor: '#7E68CF',
            color: '#ffffff',
            borderRadius: '8px',
            fontSize: '1.2rem',
            fontWeight: '500',
            textAlign: 'center',
            width: '200px'
          }}
        >
          LOTTO Tracker
        </Link>
        <Link 
          href="/pwa-test" 
          style={{
            padding: '1rem 2rem',
            backgroundColor: '#FF6B6B',
            color: '#ffffff',
            borderRadius: '8px',
            fontSize: '1.2rem',
            fontWeight: '500',
            textAlign: 'center',
            width: '200px'
          }}
        >
          📱 PWA Test & Offline Lotto
        </Link>
      </div>
    </div>
  );
}