import Link from "next/link";

export default function Home() {
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
      <h1 style={{ fontSize: '3rem', marginBottom: '3rem' }}>TraxMax</h1>
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