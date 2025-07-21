'use client';
import { useState, useEffect } from 'react';

export default function OfflineLotto() {
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [manuallySelected, setManuallySelected] = useState<number[]>([]);
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

  const saveCombination = () => {
    if (selectedNumbers.length === 7) {
      const newCombinations = [...savedCombinations, selectedNumbers];
      setSavedCombinations(newCombinations);
      localStorage.setItem('offline-lotto-combinations', JSON.stringify(newCombinations));
    }
  };

  const clearAll = () => {
    setSelectedNumbers([]);
    setManuallySelected([]);
  };

  const clearSaved = () => {
    setSavedCombinations([]);
    localStorage.removeItem('offline-lotto-combinations');
  };

  const deleteSavedCombination = (index: number) => {
    const newCombinations = savedCombinations.filter((_, i) => i !== index);
    setSavedCombinations(newCombinations);
    localStorage.setItem('offline-lotto-combinations', JSON.stringify(newCombinations));
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
            disabled={selectedNumbers.length !== 7}
          >
             Save Combination
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
              <h3> Saved Combinations ({savedCombinations.length})</h3>
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
                <button 
                  className="delete-btn"
                  onClick={() => deleteSavedCombination(index)}
                  title="Delete this combination"
                >
                  ×
                </button>
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