'use client';
import { useState, useEffect } from 'react';
import { getNumberAnalytics, type NumberAnalytics } from '../../../lib/supabase/saved-combinations-service';

export default function LottoAnalytics() {
  const [analytics, setAnalytics] = useState<NumberAnalytics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await getNumberAnalytics();
      setAnalytics(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBarWidth = (percentage: number) => {
    const maxPercentage = analytics[0]?.percentage || 0;
    return (percentage / maxPercentage) * 100;
  };

  return (
    <div className="analytics-page">
      <style jsx global>{`
        :root {
          --primary-blue: #1976d2;
          --dark-blue: rgb(6, 61, 124);
          --light-blue: #bbdefb;
          --white: white;
          --text-dark: #333;
          --text-light: #666;
          --light-gray: #f5f5f5;
        }

        .analytics-page {
          min-height: 100vh;
          background: linear-gradient(180deg, var(--primary-blue) 0%, var(--dark-blue) 100%);
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: var(--white);
        }
        
        .analytics-card {
          background: var(--white);
          border-radius: 20px;
          padding: 30px;
          margin: 20px auto;
          max-width: 800px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          color: var(--text-dark);
        }

        .analytics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
          margin-top: 30px;
        }

        .number-bar {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 10px;
          background: var(--light-gray);
          border-radius: 8px;
          margin: 5px 0;
        }

        .number-circle {
          width: 40px;
          height: 40px;
          background: var(--primary-blue);
          color: var(--white);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          flex-shrink: 0;
        }

        .bar-container {
          flex: 1;
          height: 20px;
          background: #e0e0e0;
          border-radius: 10px;
          overflow: hidden;
        }

        .bar-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--primary-blue), var(--light-blue));
          border-radius: 10px;
          transition: width 0.3s ease;
        }

        .percentage {
          min-width: 60px;
          text-align: right;
          font-weight: 600;
          color: var(--text-dark);
        }

        .loading {
          text-align: center;
          padding: 50px;
          color: var(--text-light);
        }

        .back-link {
          display: inline-block;
          padding: 12px 24px;
          background: var(--white);
          color: var(--primary-blue);
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          border: 2px solid var(--primary-blue);
          margin-bottom: 20px;
        }

        .stats-summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 20px;
          margin: 20px 0;
        }

        .stat-card {
          background: var(--light-gray);
          padding: 20px;
          border-radius: 12px;
          text-align: center;
        }

        .stat-value {
          font-size: 32px;
          font-weight: 700;
          color: var(--primary-blue);
        }

        .stat-label {
          font-size: 14px;
          color: var(--text-light);
          margin-top: 5px;
        }

        @media (max-width: 768px) {
          .analytics-grid {
            grid-template-columns: 1fr;
          }
          
          .stats-summary {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>

      <div className="analytics-card">
                 <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginBottom: '20px' }}>
           <a href="/lotto-enhanced" className="back-link">
             ← Back to Lotto Enhanced
           </a>
           <a href="/pwa-test/offline-lotto" className="back-link">
             🎯 Offline Lotto
           </a>
         </div>
        
        <h1 style={{ textAlign: 'center', margin: '20px 0' }}>
          📊 Number Analytics
        </h1>
        
        <p style={{ textAlign: 'center', color: 'var(--text-light)', marginBottom: 30 }}>
          See which numbers are most popular among all users
        </p>

        {loading ? (
          <div className="loading">Loading analytics...</div>
        ) : analytics.length === 0 ? (
          <div className="loading">No data available yet. Save some combinations to see analytics!</div>
        ) : (
          <>
            <div className="stats-summary">
              <div className="stat-card">
                <div className="stat-value">{analytics.length}</div>
                <div className="stat-label">Numbers with Data</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{analytics[0]?.frequency || 0}</div>
                <div className="stat-label">Most Popular Count</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{analytics[0]?.number || '-'}</div>
                <div className="stat-label">Most Popular Number</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{analytics[0]?.percentage || 0}%</div>
                <div className="stat-label">Top Percentage</div>
              </div>
            </div>

            <h3 style={{ marginTop: 40, marginBottom: 20 }}>Number Frequency (1-50)</h3>
            
            <div className="analytics-grid">
              <div>
                <h4>Most Popular (1-25)</h4>
                {analytics.filter(item => item.number <= 25).map(item => (
                  <div key={item.number} className="number-bar">
                    <div className="number-circle">{item.number}</div>
                    <div className="bar-container">
                      <div 
                        className="bar-fill" 
                        style={{ width: `${getBarWidth(item.percentage)}%` }}
                      />
                    </div>
                    <div className="percentage">{item.percentage}%</div>
                  </div>
                ))}
              </div>
              
              <div>
                <h4>Most Popular (26-50)</h4>
                {analytics.filter(item => item.number > 25).map(item => (
                  <div key={item.number} className="number-bar">
                    <div className="number-circle">{item.number}</div>
                    <div className="bar-container">
                      <div 
                        className="bar-fill" 
                        style={{ width: `${getBarWidth(item.percentage)}%` }}
                      />
                    </div>
                    <div className="percentage">{item.percentage}%</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 