'use client';
import { useState, useEffect } from 'react';
import { 
  saveCombination as saveToSupabase, 
  getUserCombinations, 
  deleteCombination as deleteFromSupabase,
  syncLocalToSupabase,
  type SavedCombination 
} from '../../../lib/supabase/saved-combinations-service';

export default function OfflineLotto() {
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [manuallySelected, setManuallySelected] = useState<number[]>([]);
  const [savedCombinations, setSavedCombinations] = useState<SavedCombination[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadCombinations();
    checkOnlineStatus();
  }, []);

  const checkOnlineStatus = () => {
    setIsOnline(navigator.onLine);
    window.addEventListener('online', () => setIsOnline(true));
    window.addEventListener('offline', () => setIsOnline(false));
  };

  const loadCombinations = async () => {
    try {
      setSyncing(true);
      
      if (isOnline) {
        // Try to sync local data first
        await syncLocalToSupabase();
        
        // Load from Supabase
        const combinations = await getUserCombinations();
        setSavedCombinations(combinations);
      } else {
        // Load from localStorage as fallback
        const saved = localStorage.getItem('offline-lotto-combinations');
        if (saved) {
          const localCombinations: number[][] = JSON.parse(saved);
          // Convert to SavedCombination format for display
          const convertedCombinations: SavedCombination[] = localCombinations.map((numbers, index) => ({
            id: `local_${index}`,
            user_id: 'local',
            numbers,
            created_at: new Date().toISOString(),
          }));
          setSavedCombinations(convertedCombinations);
        }
      }
    } catch (error) {
      console.error('Error loading combinations:', error);
      // Fallback to localStorage
      const saved = localStorage.getItem('offline-lotto-combinations');
      if (saved) {
        const localCombinations: number[][] = JSON.parse(saved);
        const convertedCombinations: SavedCombination[] = localCombinations.map((numbers, index) => ({
          id: `local_${index}`,
          user_id: 'local',
          numbers,
          created_at: new Date().toISOString(),
        }));
        setSavedCombinations(convertedCombinations);
      }
    } finally {
      setSyncing(false);
    }
  };

  const generateRandomNumbers = () => {
    setIsGenerating(true);
    
    // Generate final numbers immediately
    const finalNumbers: number[] = [...manuallySelected]; // Start with manually selected (locked) numbers
    while (finalNumbers.length < 7) {
      const num = Math.floor(Math.random() * 50) + 1;
      if (!finalNumbers.includes(num)) {
        finalNumbers.push(num);
      }
    }
    
    // Animate the generation
    let iterations = 0;
    const maxIterations = 15;
    
    const interval = setInterval(() => {
      // During animation, show random numbers but keep locked ones
      const animationNumbers: number[] = [...manuallySelected];
      while (animationNumbers.length < 7) {
        const num = Math.floor(Math.random() * 50) + 1;
        if (!animationNumbers.includes(num)) {
          animationNumbers.push(num);
        }
      }
      setSelectedNumbers(animationNumbers.sort((a, b) => a - b));
      
      iterations++;
      if (iterations >= maxIterations) {
        clearInterval(interval);
        setSelectedNumbers(finalNumbers.sort((a, b) => a - b));
        setIsGenerating(false);
      }
          }, 120);
  };

  const toggleNumber = (num: number) => {
    if (selectedNumbers.includes(num)) {
      // Remove from selected and manually selected
      setSelectedNumbers(selectedNumbers.filter(n => n !== num));
      setManuallySelected(manuallySelected.filter(n => n !== num));
    } else if (selectedNumbers.length < 7) {
      // Add to selected and mark as manually selected
      setSelectedNumbers([...selectedNumbers, num].sort((a, b) => a - b));
      setManuallySelected([...manuallySelected, num].sort((a, b) => a - b));
    }
  };

  const saveCombination = async () => {
    if (selectedNumbers.length !== 7) return;
    
    try {
      setSyncing(true);
      
      if (isOnline) {
        // Save to Supabase
        await saveToSupabase(selectedNumbers);
        // Reload combinations
        await loadCombinations();
      } else {
        // Save locally as fallback
        const saved = localStorage.getItem('offline-lotto-combinations');
        const localCombinations: number[][] = saved ? JSON.parse(saved) : [];
        localCombinations.push(selectedNumbers);
        localStorage.setItem('offline-lotto-combinations', JSON.stringify(localCombinations));
        
        // Update state with new local combination
        const newCombination: SavedCombination = {
          id: `local_${Date.now()}`,
          user_id: 'local',
          numbers: selectedNumbers,
          created_at: new Date().toISOString(),
        };
        setSavedCombinations([newCombination, ...savedCombinations]);
      }
    } catch (error) {
      console.error('Save failed:', error);
      // Fallback to localStorage
      const saved = localStorage.getItem('offline-lotto-combinations');
      const localCombinations: number[][] = saved ? JSON.parse(saved) : [];
      localCombinations.push(selectedNumbers);
      localStorage.setItem('offline-lotto-combinations', JSON.stringify(localCombinations));
      
      const newCombination: SavedCombination = {
        id: `local_${Date.now()}`,
        user_id: 'local',
        numbers: selectedNumbers,
        created_at: new Date().toISOString(),
      };
      setSavedCombinations([newCombination, ...savedCombinations]);
    } finally {
      setSyncing(false);
    }
  };

  const clearAll = () => {
    setSelectedNumbers([]);
    setManuallySelected([]);
  };

  const clearSaved = async () => {
    try {
      setSyncing(true);
      
      if (isOnline) {
        // Delete all combinations from Supabase
        for (const combination of savedCombinations) {
          if (!combination.id.startsWith('local_')) {
            await deleteFromSupabase(combination.id);
          }
        }
      }
      
      // Clear localStorage
      localStorage.removeItem('offline-lotto-combinations');
      setSavedCombinations([]);
    } catch (error) {
      console.error('Error clearing saved combinations:', error);
      // Fallback to local clear
      localStorage.removeItem('offline-lotto-combinations');
      setSavedCombinations([]);
    } finally {
      setSyncing(false);
    }
  };

  const deleteSavedCombination = async (id: string) => {
    try {
      setSyncing(true);
      
      if (isOnline && !id.startsWith('local_')) {
        // Delete from Supabase
        await deleteFromSupabase(id);
      } else {
        // Delete from localStorage for local items
        const saved = localStorage.getItem('offline-lotto-combinations');
        if (saved) {
          const localCombinations: number[][] = JSON.parse(saved);
          const index = parseInt(id.replace('local_', ''));
          if (index >= 0 && index < localCombinations.length) {
            localCombinations.splice(index, 1);
            localStorage.setItem('offline-lotto-combinations', JSON.stringify(localCombinations));
          }
        }
      }
      
      // Update state
      setSavedCombinations(savedCombinations.filter(c => c.id !== id));
    } catch (error) {
      console.error('Error deleting combination:', error);
      // Fallback to local removal
      setSavedCombinations(savedCombinations.filter(c => c.id !== id));
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="offline-lotto">
      <style jsx global>{`
        :root {
          --primary-blue: #1976d2;
          --dark-blue: rgb(6, 61, 124);
          --light-blue: #bbdefb;
          --hover-blue: #1565c0;
          --white: white;
          --text-dark: #333;
          --text-light: #666;
          --light-gray: #f5f5f5;
          --border-gray: #ccc;
          --yellow-bright: #FFFF00;
          --yellow-accent: rgba(255, 217, 0, 0.85);
          --shadow-light: rgba(0, 0, 0, 0.1);
          --shadow-blue: rgba(25, 118, 210, 0.3);
        }

        .offline-lotto {
          min-height: 100vh;
          background: linear-gradient(180deg, var(--primary-blue) 0%, var(--dark-blue) 100%);
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: var(--white);
        }
        
        .lotto-card {
          background: var(--white);
          border-radius: 20px;
          padding: 30px;
          margin: 20px auto;
          max-width: 600px;
          box-shadow: 0 20px 40px var(--shadow-light);
          color: var(--text-dark);
        }
        
                 .number-grid {
           display: grid;
           grid-template-columns: repeat(5, 45px);
           gap: 6px;
           margin: 30px auto;
           justify-content: center;
           max-width: fit-content;
         }
        
                         .number-btn {
          width: 45px;
          height: 45px;
          border: 2px solid var(--light-blue);
          background: var(--white);
          color: var(--text-light);
          border-radius: 50%;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .number-btn.faded {
          opacity: 0.5;
        }
        
        .number-btn:hover {
          background: var(--light-gray);
          transform: scale(1.05);
        }
        
        .number-btn.selected {
          background: var(--white);
          color: var(--text-dark);
          border-color: var(--primary-blue);
          border-width: 4px;
          box-shadow: 0 0 20px var(--shadow-blue);
        }
        
        .number-btn.selected.manually-selected {
          position: relative;
          border-color: transparent !important;
          color: var(--text-dark) !important;
        }
        
        .number-btn.manually-selected::before {
          content: '';
          position: absolute;
          top: -5px;
          left: -5px;
          right: -5px;
          bottom: -5px;
          border: 4px solid var(--primary-blue);
          border-radius: 50%;
          pointer-events: none;
          z-index: 10;
        }
        
        .number-btn.manually-selected::after {
          content: '';
          position: absolute;
          top: -8px;
          left: -8px;
          right: -8px;
          bottom: -8px;
          border: 3px solid var(--yellow-accent);
          border-radius: 50%;
          pointer-events: none;
          opacity: 0.8;
          z-index: 10;
        }
        

        
        .selected-display {
          display: flex;
          justify-content: center;
          gap: 15px;
          margin: 30px 0;
          min-height: 60px;
          align-items: center;
          flex-wrap: wrap;
        }
        
                         .selected-number {
          width: 50px;
          height: 50px;
          background: var(--white);
          color: var(--text-dark);
          border: 8px solid var(--primary-blue);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          font-weight: 700;
          box-shadow: 0 2px 8px var(--shadow-blue);
          animation: bounceIn 0.5s ease;
        }
        
        .empty-slot {
          width: 45px;
          height: 45px;
          border: 2px dashed var(--border-gray);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--border-gray);
        }
        
        .control-buttons {
          display: flex;
          gap: 15px;
          justify-content: center;
          margin: 30px 0;
          flex-wrap: wrap;
        }
        
        .btn {
          padding: 15px 25px;
          border: none;
          border-radius: 30px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          min-width: 120px;
        }
        
        .btn-primary {
          background: var(--primary-blue);
          color: var(--white);
        }
        
        .btn-primary:hover {
          background: var(--hover-blue);
          transform: translateY(-2px);
        }
        
        .btn-secondary {
          background: var(--white);
          color: var(--primary-blue);
          border: 2px solid var(--primary-blue);
        }
        
        .btn-secondary:hover {
          background: var(--light-gray);
          transform: translateY(-2px);
        }
        
        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none !important;
        }
        
        .saved-combinations {
          margin-top: 40px;
        }
        
        .saved-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 15px;
          background: var(--light-gray);
          border-radius: 12px;
          margin: 10px 0;
          position: relative;
        }
        
        .delete-btn {
          margin-left: auto;
          background: none;
          border: none;
          color: #e53e3e;
          font-size: 18px;
          cursor: pointer;
          padding: 5px;
          border-radius: 50%;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }
        
        .delete-btn:hover {
          background: rgba(229, 62, 62, 0.1);
          transform: scale(1.1);
        }
        
        .saved-numbers {
          display: flex;
          gap: 8px;
        }
        
        .saved-number {
          width: 30px;
          height: 30px;
          background: var(--primary-blue);
          color: var(--white);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 600;
        }
        
        @keyframes bounceIn {
          0% { transform: scale(0); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        
        .generating {
          animation: pulse 0.5s infinite alternate;
        }
        
        @keyframes pulse {
          from { opacity: 0.5; }
          to { opacity: 1; }
        }

                         @media (max-width: 768px) {
          .number-grid {
            grid-template-columns: repeat(5, 45px);
            gap: 5px;
          }
          
          .number-btn {
            font-size: 14px;
          }
          
          .selected-display {
            gap: 8px;
            justify-content: center;
            flex-wrap: nowrap;
            overflow-x: auto;
            padding: 0 10px;
          }
          
          .selected-number {
            width: 40px;
            height: 40px;
            font-size: 14px;
            border-width: 6px;
            flex-shrink: 0;
          }
          
          .empty-slot {
            width: 40px;
            height: 40px;
            flex-shrink: 0;
          }
          
          .control-buttons {
            flex-direction: column;
            align-items: center;
          }
          
          .btn {
            width: 200px;
          }
        }
      `}</style>

      <div className="lotto-card">
        <h1 style={{ textAlign: 'center', margin: '0 0 20px 0' }}>
         Pick 7 lucky numbers
        </h1>
        
    

        <div className="number-grid">
          {Array.from({ length: 50 }, (_, i) => i + 1).map(num => (
            <button
              key={num}
              className={`number-btn ${selectedNumbers.includes(num) ? 'selected' : ''} ${manuallySelected.includes(num) ? 'manually-selected' : ''} ${selectedNumbers.length === 7 && !selectedNumbers.includes(num) ? 'faded' : ''}`}
              onClick={() => toggleNumber(num)}
              disabled={!selectedNumbers.includes(num) && selectedNumbers.length >= 7}
            >
              {num}
            </button>
          ))}
        </div>

        <div className="selected-display">
          {Array.from({ length: 7 }, (_, i) => (
            selectedNumbers[i] ? (
              <div key={i} className={`selected-number ${isGenerating ? 'generating' : ''}`}>
                {selectedNumbers[i]}
              </div>
            ) : (
              <div key={i} className="empty-slot">•</div>
            )
          ))}
        </div>

                <div className="control-buttons">
          <button 
            className="btn btn-primary" 
            onClick={generateRandomNumbers}
            disabled={isGenerating}
            style={{ minWidth: '355px' }}
          >
             {isGenerating ? 'Generating...' : 'Random Numbers'}
          </button>
        </div>
        
        <div className="control-buttons">
                      <button 
            className="btn btn-secondary" 
            onClick={saveCombination}
            disabled={selectedNumbers.length !== 7 || syncing}
          >
              {syncing ? 'Saving...' : 'Save Combination'} {!isOnline && '(Offline)'}
          </button>
          
          <button 
            className="btn btn-secondary" 
            onClick={clearAll}
          >
             Clear All
          </button>
        </div>

        {savedCombinations.length > 0 && (
          <div className="saved-combinations">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3> Saved Combinations ({savedCombinations.length}) {!isOnline && '(Offline)'}</h3>
              <button className="btn btn-secondary" onClick={clearSaved} style={{ padding: '8px 15px', minWidth: 'auto' }} disabled={syncing}>
                {syncing ? 'Syncing...' : 'Clear Saved'}
              </button>
            </div>
            
            {savedCombinations.map((combination, index) => (
              <div key={combination.id} className="saved-item">
                <span style={{ minWidth: 30 }}>#{index + 1}</span>
                <div className="saved-numbers">
                  {combination.numbers.map(num => (
                    <div key={num} className="saved-number">{num}</div>
                  ))}
                </div>
                <button 
                  className="delete-btn"
                  onClick={() => deleteSavedCombination(combination.id)}
                  title="Delete this combination"
                  disabled={syncing}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

                <div style={{ textAlign: 'center', marginTop: 40, display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a 
            href="/pwa-test/analytics" 
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              background: 'var(--white)',
              color: 'var(--primary-blue)',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              border: '2px solid var(--primary-blue)'
            }}
          >
            📊 View Analytics
          </a>
          <a 
            href="/pwa-test" 
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              background: 'var(--white)',
              color: 'var(--primary-blue)',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              border: '2px solid var(--primary-blue)'
            }}
          >
            ← Back to PWA Test
          </a>
        </div>
      </div>
    </div>
  );
} 