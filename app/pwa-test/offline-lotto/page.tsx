'use client';
import { useState, useEffect } from 'react';

export default function OfflineLotto() {
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [savedCombinations, setSavedCombinations] = useState<number[][]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    // Load saved combinations from localStorage
    const saved = localStorage.getItem('offline-lotto-combinations');
    if (saved) {
      setSavedCombinations(JSON.parse(saved));
    }
  }, []);

  const generateRandomNumbers = () => {
    setIsGenerating(true);
    
    // Animate the generation
    let iterations = 0;
    const maxIterations = 20;
    
    const interval = setInterval(() => {
             const newNumbers: number[] = [];
       while (newNumbers.length < 7) {
         const num = Math.floor(Math.random() * 50) + 1;
         if (!newNumbers.includes(num)) {
           newNumbers.push(num);
         }
       }
      setSelectedNumbers(newNumbers.sort((a, b) => a - b));
      
      iterations++;
      if (iterations >= maxIterations) {
        clearInterval(interval);
        setIsGenerating(false);
      }
    }, 100);
  };

  const toggleNumber = (num: number) => {
    if (selectedNumbers.includes(num)) {
      setSelectedNumbers(selectedNumbers.filter(n => n !== num));
    } else if (selectedNumbers.length < 7) {
      setSelectedNumbers([...selectedNumbers, num].sort((a, b) => a - b));
    }
  };

  const saveCombination = () => {
    if (selectedNumbers.length === 7) {
      const newCombinations = [...savedCombinations, selectedNumbers];
      setSavedCombinations(newCombinations);
      localStorage.setItem('offline-lotto-combinations', JSON.stringify(newCombinations));
    }
  };

  const clearAll = () => {
    setSelectedNumbers([]);
  };

  const clearSaved = () => {
    setSavedCombinations([]);
    localStorage.removeItem('offline-lotto-combinations');
  };

  return (
    <div className="offline-lotto">
      <style jsx global>{`
        .offline-lotto {
          min-height: 100vh;
          background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: white;
        }
        
        .lotto-card {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 30px;
          margin: 20px auto;
          max-width: 600px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.2);
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
           border: 2px solid rgba(255, 255, 255, 0.3);
           background: rgba(255, 255, 255, 0.1);
           color: white;
           border-radius: 50%;
           font-size: 14px;
           font-weight: 600;
           cursor: pointer;
           transition: all 0.3s ease;
           display: flex;
           align-items: center;
           justify-content: center;
         }
        
        .number-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: scale(1.05);
        }
        
        .number-btn.selected {
          background: #FFD700;
          color: #1e3c72;
          border-color: #FFD700;
          box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
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
           width: 45px;
           height: 45px;
           background: #FFD700;
           color: #1e3c72;
           border-radius: 50%;
           display: flex;
           align-items: center;
           justify-content: center;
           font-size: 16px;
           font-weight: 700;
           box-shadow: 0 4px 15px rgba(255, 215, 0, 0.4);
           animation: bounceIn 0.5s ease;
         }
         
         .empty-slot {
           width: 45px;
           height: 45px;
           border: 2px dashed rgba(255, 255, 255, 0.3);
           border-radius: 50%;
           display: flex;
           align-items: center;
           justify-content: center;
           color: rgba(255, 255, 255, 0.5);
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
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          min-width: 120px;
        }
        
        .btn-primary {
          background: #FFD700;
          color: #1e3c72;
        }
        
        .btn-primary:hover {
          background: #FFC700;
          transform: translateY(-2px);
        }
        
        .btn-secondary {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }
        
        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.3);
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
          background: rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          margin: 10px 0;
        }
        
        .saved-numbers {
          display: flex;
          gap: 8px;
        }
        
        .saved-number {
          width: 30px;
          height: 30px;
          background: rgba(255, 215, 0, 0.8);
          color: #1e3c72;
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
          🎯 Offline Lotto Generator
        </h1>
        
                 <p style={{ textAlign: 'center', opacity: 0.8, marginBottom: 30 }}>
           🔌 Works completely offline! Select 7 numbers from 1-50 or generate random ones.
         </p>

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
          >
            🎲 {isGenerating ? 'Generating...' : 'Random Numbers'}
          </button>
          
          <button 
            className="btn btn-secondary" 
            onClick={saveCombination}
            disabled={selectedNumbers.length !== 7}
          >
            💾 Save Combination
          </button>
          
          <button 
            className="btn btn-secondary" 
            onClick={clearAll}
          >
            🗑️ Clear All
          </button>
        </div>

                 <div className="number-grid">
           {Array.from({ length: 50 }, (_, i) => i + 1).map(num => (
            <button
              key={num}
              className={`number-btn ${selectedNumbers.includes(num) ? 'selected' : ''}`}
              onClick={() => toggleNumber(num)}
              disabled={!selectedNumbers.includes(num) && selectedNumbers.length >= 7}
            >
              {num}
            </button>
          ))}
        </div>

        {savedCombinations.length > 0 && (
          <div className="saved-combinations">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3>💾 Saved Combinations ({savedCombinations.length})</h3>
              <button className="btn btn-secondary" onClick={clearSaved} style={{ padding: '8px 15px', minWidth: 'auto' }}>
                Clear Saved
              </button>
            </div>
            
            {savedCombinations.map((combination, index) => (
              <div key={index} className="saved-item">
                <span style={{ minWidth: 30 }}>#{index + 1}</span>
                <div className="saved-numbers">
                  {combination.map(num => (
                    <div key={num} className="saved-number">{num}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <a 
            href="/pwa-test" 
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              background: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              border: '1px solid rgba(255, 255, 255, 0.3)'
            }}
          >
            ← Back to PWA Test
          </a>
        </div>
      </div>
    </div>
  );
} 