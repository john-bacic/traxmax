'use client';
import { useState, useEffect } from 'react';
import { getNumberAnalytics, getTotalSavedCombinations, getTotalUsers, type NumberAnalytics } from '../../../lib/supabase/saved-combinations-service';

export default function LottoAnalytics() {
  const [analytics, setAnalytics] = useState<NumberAnalytics[]>([]);
  const [combinationCounts, setCombinationCounts] = useState<{total: number, complete: number, incomplete: number}>({total: 0, complete: 0, incomplete: 0});
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // Load analytics, combination counts, and user count in parallel
      const [analyticsData, countsData, userCountData] = await Promise.all([
        getNumberAnalytics(),
        getTotalSavedCombinations(),
        getTotalUsers()
      ]);
      
      // Add 0% frequency numbers (numbers 1-50 that aren't in the data)
      const existingNumbers = new Set(analyticsData.map(item => item.number));
      const allNumbers = Array.from({ length: 50 }, (_, i) => i + 1);
      const zeroFrequencyNumbers = allNumbers.filter(num => !existingNumbers.has(num));
      
      // Add 0% numbers to the analytics data
      const zeroFreqItems = zeroFrequencyNumbers.map(number => ({
        number,
        frequency: 0,
        percentage: 0.0
      }));
      
      const fullAnalytics = [...analyticsData, ...zeroFreqItems];
      setAnalytics(fullAnalytics);
      setCombinationCounts(countsData);
      setTotalUsers(userCountData);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="analytics-page">
      <style jsx global>{`
        body {
          font-family: 'Lexend', sans-serif;
          background-color: rgb(8, 8, 8);
          margin: 0;
          padding: 0;
          color: #7e68cf;
          min-height: 100vh;
        }

        .analytics-page {
          min-height: 100vh;
          background-color: rgb(8, 8, 8);
          padding: 20px;
          font-family: 'Lexend', sans-serif;
          color: #7e68cf;
        }

        /* TOP NAV similar to lotto pages */
        .topNav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background-color: rgba(8, 8, 8, 0.85);
          backdrop-filter: blur(5px);
          -webkit-backdrop-filter: blur(5px);
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 0.5rem .75rem;
          z-index: 100;
          transition: transform 0.3s ease-in-out;
        }

        .back-button {
          background-color: #242424;
          color: #7e68cf;
          border-radius: 8px;
          font-size: 0.875em;
          font-family: 'Lexend', sans-serif;
          font-weight: 700;
          padding: 8px 16px;
          border: none;
          text-shadow: 0px 5px 8px rgba(0, 0, 0, 0.5);
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: background-color 0.3s ease;
        }

        .back-button:hover {
          background-color: #333;
        }

        .analytics-title {
          color: #c2b2ff;
          font-family: 'Lexend', sans-serif;
          font-weight: 700;
          font-size: 1.5em;
          margin: 0;
        }

        /* Main content container */
        .analytics-container {
          margin-top: 80px;
          padding: 20px;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
        }

         .frequency-header {
           color: #c2b2ff;
           font-family: 'Lexend', sans-serif;
           font-weight: 700;
           font-size: 1.25em;
           margin: 0 0 20px 0;
           text-align: left;
           text-shadow: 0px 5px 8px rgba(0, 0, 0, 0.5);
         }

                                       .frequency-header-container {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 20px;
          }

         .frequency-refresh-button {
           background: none;
           color: #c2b2ff;
           border: none;
           cursor: pointer;
           font-size: 1.25rem;
           display: flex;
           align-items: center;
           justify-content: center;
           padding: 4px;
           margin-top: -15px;
           transition: all 0.2s ease;
         }

         .frequency-refresh-button:hover {
           color: #ffffff;
           transform: scale(1.1);
         }

         .total-saved {
           color: #7e68cf;
           font-family: 'Lexend', sans-serif;
           font-weight: 400;
           font-size: 0.9em;
           margin: 0 0 20px 0;
           text-align: left;
           opacity: 0.8;
         }

        /* Frequency list styling to match the image */
        .frequency-list {
          font-family: 'Lexend', sans-serif;
          font-weight: 700;
          font-variant-numeric: tabular-nums;
          line-height: 1.6;
          margin: 0;
          padding: 0;
        }

                 .frequency-item {
           display: flex;
           align-items: flex-start;
           margin: 8px 0;
           font-size: 1rem;
         }

        .frequency-number {
          color: #c2b2ff;
          font-weight: 700;
          margin-right: 8px;
        }

        .frequency-colon {
          color: #c2b2ff;
          margin-right: 8px;
        }

                 .frequency-percentage {
           color: #7e68cf;
           font-weight: 700;
           min-width: 50px;
         }

        .frequency-numbers {
          color: #7e68cf;
          margin-left: 8px;
          font-weight: 400;
        }

        .frequency-separator {
          color: #7e68cf;
          margin: 0 4px;
        }

        .loading {
          text-align: center;
          padding: 100px 20px;
          color: rgba(126, 104, 207, 0.8);
          font-size: 1.1em;
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .analytics-container {
            padding: 15px;
          }
          
          .frequency-item {
            font-size: 0.9rem;
          }
        }
      `}</style>

      {/* TOP NAV */}
      <div className="topNav">
        <a href="/lotto-enhanced" className="back-button">
          ← Back to Lotto
        </a>
        
        <h1 className="analytics-title">📊 Analytics</h1>
        
        <a href="/pwa-test/offline-lotto" className="back-button">
          🎯 Offline
        </a>
      </div>

      {/* Main Content */}
      <div className="analytics-container">
        
        <div className="frequency-header-container">
          <div className="frequency-header">number frequency</div>
          <button className="frequency-refresh-button" onClick={loadAnalytics} title="Refresh Analytics">
            ↻
          </button>
        </div>

        {loading ? (
          <div className="loading">Loading analytics...</div>
        ) : analytics.length === 0 ? (
          <div className="loading">No data available yet. Save some combinations to see analytics!</div>
        ) : (
          <>
            <div className="total-saved">
              <div>total saved: {analytics.reduce((sum, item) => sum + item.frequency, 0)} numbers</div>
              <div>{totalUsers} unique users</div>
              <div>{combinationCounts.complete} complete rows</div>
              {combinationCounts.incomplete > 0 && (
                <div>{combinationCounts.incomplete} incomplete rows</div>
              )}
            </div>
          <div className="frequency-list">
            {analytics.map(item => {
              // Group numbers by frequency
              const sameFrequency = analytics.filter(a => a.frequency === item.frequency);
              const isFirst = analytics.findIndex(a => a.frequency === item.frequency) === analytics.indexOf(item);
              
              if (!isFirst) return null; // Only show first occurrence of each frequency
              
              // Sort numbers in ascending order
              const sortedNumbers = sameFrequency.sort((a, b) => a.number - b.number);
              
              // Use the percentage already calculated by the analytics service
              const percentage = item.percentage.toFixed(1);
              const isZeroFreq = item.frequency === 0;
              
              return (
                <div key={item.frequency} className="frequency-item">
                  <span className="frequency-number">{item.frequency}x</span>
                  <span className="frequency-colon">:</span>
                  <span className="frequency-percentage" style={{ color: isZeroFreq ? '#ff69b4' : '#c2b2ff' }}>{percentage}%</span>
                  <span className="frequency-numbers">
                    {sortedNumbers.map((num, index) => (
                      <span key={num.number} style={{ color: isZeroFreq ? '#ff69b4' : '#7e68cf' }}>
                        {num.number}
                        {index < sortedNumbers.length - 1 && (
                          <span className="frequency-separator" style={{ color: isZeroFreq ? '#ff69b4' : '#7e68cf' }}> • </span>
                        )}
                      </span>
                    ))}
                  </span>
                </div>
              );
            })}
          </div>
          </>
        )}
      </div>
    </div>
  );
} 