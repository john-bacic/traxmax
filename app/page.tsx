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
      <div style={{ display: 'flex', gap: '2rem' }}>
        <Link 
          href="/game" 
          style={{
            padding: '1rem 2rem',
            backgroundColor: '#CCFF00',
            color: '#000000',
            borderRadius: '8px',
            fontSize: '1.2rem',
            fontWeight: '500'
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
            fontWeight: '500'
          }}
        >
          LOTTO Tracker
        </Link>
      </div>
    </div>
  );
}