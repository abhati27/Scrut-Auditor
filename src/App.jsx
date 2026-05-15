import { useState, useEffect, useRef } from 'react';
import { Shield, AlertTriangle, Loader, ArrowRight } from 'lucide-react';

const DEMOS = {
  contradiction: [
    {
      a: 'The liability of the contractor shall be limited to direct damages only, not exceeding the total fees paid under this agreement. Under no circumstances shall the contractor be liable for consequential, indirect, or punitive damages.',
      b: 'The contractor shall be fully liable for all damages arising from breach of this agreement, including consequential, indirect, special, and punitive damages, without any cap or limitation on the total amount recoverable by the client.',
    },
    {
      a: 'All disputes arising under this agreement shall be resolved exclusively through binding arbitration. Neither party may initiate litigation in any court of law.',
      b: 'Either party may bring any claim or dispute arising from this agreement before the courts of the State of Delaware, which shall have exclusive jurisdiction over all such matters.',
    },
    {
      a: 'Seller expressly warrants that it holds clear and unencumbered title to all goods sold hereunder and that the buyer shall receive good title free of all liens and claims.',
      b: 'Seller makes no warranty of title and expressly disclaims any representation regarding ownership or encumbrances. Buyer accepts all goods subject to any existing claims or liens.',
    },
    {
      a: 'This agreement may not be assigned or transferred by either party without the prior written consent of the other party.',
      b: 'Either party may freely assign this agreement to any successor entity without the consent of the other party.',
    },
    {
      a: 'All data submitted to the platform and outputs derived therefrom shall become the exclusive property of the service provider and may be used for platform improvement.',
      b: 'All client data and derived outputs remain the exclusive property of the client. The service provider acquires no ownership rights and shall not use client data for any purpose beyond direct service delivery.',
    },
  ],
  clear: [
    {
      a: 'Payment shall be due within thirty (30) calendar days of the invoice date. Late payments shall accrue interest at 1.5% per month.',
      b: 'The buyer agrees to settle all invoices no later than thirty days from issuance. Any overdue balance shall bear interest at a monthly rate of one and one-half percent (1.5%).',
    },
    {
      a: 'This agreement shall be governed by and construed in accordance with the laws of the State of New York, without regard to its conflict of laws provisions.',
      b: 'The parties agree that any legal matter arising from this contract shall be interpreted under New York state law, excluding its choice of law rules.',
    },
    {
      a: 'The vendor warrants that all delivered software shall be free from material defects for a period of twelve (12) months following delivery.',
      b: 'Supplier guarantees the product against material defects for one year from the date of delivery, during which time it will repair or replace defective items at no additional cost.',
    },
    {
      a: 'Neither party shall be liable for delays or failures in performance resulting from circumstances beyond its reasonable control, including acts of God, natural disasters, or government actions.',
      b: 'A party shall be excused from performance obligations to the extent caused by events outside its reasonable control such as natural disasters, pandemics, governmental orders, or acts of God.',
    },
    {
      a: 'All notices under this agreement shall be in writing and delivered by certified mail or overnight courier to the address specified in Schedule A.',
      b: 'Any notice required under this contract must be written and sent via certified post or recognized overnight delivery service to the addresses set forth in Schedule A.',
    },
  ],
};

export default function ScrutAuditor() {
  const [clauseA, setClauseA] = useState('');
  const [clauseB, setClauseB] = useState('');
  const [result, setResult] = useState(null);
  const [reason, setReason] = useState(null);
  const [reasonLoading, setReasonLoading] = useState(false);
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [modelStatus, setModelStatus] = useState('checking');
  const [duration, setDuration] = useState(null);
  const [mounted, setMounted] = useState(false);

  const resultRef = useRef(null);

  useEffect(() => {
    setMounted(true);
    checkHealth();
  }, []);

  // Cmd+Enter / Ctrl+Enter to run analysis
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        if (clauseA.trim() && clauseB.trim() && !isLoading) {
          runAnalysis();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [clauseA, clauseB, isLoading]);

  const checkHealth = async () => {
    try {
      const res = await fetch('https://abhati27-law-auditor-api.hf.space/api/tags');
      const data = await res.json();
      setModelStatus(data.models && data.models.length > 0 ? 'active' : 'offline');
    } catch {
      setModelStatus('offline');
    }
  };

  const runAnalysis = async () => {
    if (!clauseA.trim() || !clauseB.trim()) return;
    setIsLoading(true);
    setError(false);
    setResult(null);
    setReason(null);
    const userContent = `Current statement: ${clauseA}. Historical statement: ${clauseB}.`;
    try {
      const res = await fetch('https://abhati27-law-auditor-api.hf.space/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'scrut-auditor:latest',
          messages: [{ role: 'user', content: userContent }],
          stream: false,
        }),
      });
      const data = await res.json();
      const raw = data.message.content;
      const parsed = JSON.parse(raw);
      setResult(parsed);
      setDuration(Math.round(data.total_duration / 1_000_000));
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 120);

      // Follow-up call for the specific reason
      setReasonLoading(true);
      try {
        const res2 = await fetch('https://abhati27-law-auditor-api.hf.space/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'scrut-auditor:latest',
            messages: [
              { role: 'user', content: userContent },
              { role: 'assistant', content: raw },
              { role: 'user', content: 'In one concise sentence, explain specifically why.' },
            ],
            stream: false,
          }),
        });
        const data2 = await res2.json();
        setReason(data2.message.content);
      } catch {
        setReason(null);
      } finally {
        setReasonLoading(false);
      }
    } catch {
      setError(true);
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 120);
    } finally {
      setIsLoading(false);
    }
  };

  const canRun = clauseA.trim().length > 0 && clauseB.trim().length > 0;
  const statusText =
    modelStatus === 'active' ? 'System Online' : modelStatus === 'offline' ? 'System Offline' : 'Connecting...';

  const fadeClass = (delay) => (mounted ? `fade-in-${delay}` : 'initially-hidden');

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

        :root {
          --bg-base: #F3F4F6;
          --bg-panel: #FFFFFF;
          --border: #E5E7EB;
          --border-focus: #D1D5DB;
          --text-main: #111827;
          --text-muted: #6B7280;
          --text-light: #9CA3AF;
          --primary: #111827;
          --primary-hover: #374151;
        }

        *, *::before, *::after { box-sizing: border-box; }

        body {
          margin: 0;
          background-color: var(--bg-base);
          color: var(--text-main);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          min-height: 100vh;
          overflow-x: hidden;
          -webkit-font-smoothing: antialiased;
        }

        .panel {
          background: var(--bg-panel);
          border: 1px solid var(--border);
          border-radius: 4px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }

        h1, h2, h3, h4 { margin: 0; font-weight: 600; }

        @keyframes reveal {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }

        .initially-hidden { opacity: 0; }
        .fade-in-0   { animation: reveal 0.4s ease-out 0ms   both; }
        .fade-in-100 { animation: reveal 0.4s ease-out 100ms both; }
        .fade-in-200 { animation: reveal 0.4s ease-out 200ms both; }

        .status-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
        }
        .status-dot.active { background-color: #10B981; }
        .status-dot.offline { background-color: #EF4444; }
        .status-dot.checking { background-color: #D1D5DB; }

        /* Nav */
        .navbar {
          position: fixed;
          top: 0; left: 0; right: 0;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 32px;
          background: var(--bg-panel);
          border-bottom: 1px solid var(--border);
          z-index: 1000;
        }

        /* Textareas */
        .input-label {
          display: flex; justify-content: space-between; align-items: center;
          font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;
          color: var(--text-muted);
          margin-bottom: 8px;
        }
        .scrut-textarea {
          width: 100%;
          min-height: 200px;
          background: #F9FAFB;
          border: 1px solid var(--border);
          border-radius: 4px;
          padding: 16px;
          font-family: 'Times New Roman', Times, serif;
          font-size: 16px;
          line-height: 1.6;
          color: var(--text-main);
          resize: vertical;
          outline: none;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .scrut-textarea::placeholder { color: var(--text-light); font-family: 'Inter', sans-serif; font-size: 14px; }
        .scrut-textarea:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 1px var(--primary);
          background: var(--bg-panel);
        }

        .clear-btn {
          background: none; border: none; cursor: pointer;
          color: var(--text-muted); transition: color 0.15s;
          display: flex; align-items: center; gap: 4px; font-size: 12px; font-family: 'Inter'; text-transform: none; letter-spacing: 0;
        }
        .clear-btn:hover { color: var(--text-main); }

        /* Buttons */
        .demo-btn {
          background: var(--bg-panel);
          border: 1px solid var(--border);
          color: var(--text-main);
          padding: 6px 12px;
          border-radius: 4px;
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }
        .demo-btn:hover {
          border-color: var(--border-focus);
          background: #F9FAFB;
        }

        .primary-btn {
          background: var(--primary);
          border: 1px solid var(--primary);
          color: #fff;
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          font-weight: 500;
          padding: 0 24px;
          height: 36px;
          border-radius: 4px;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: background 0.15s ease;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }
        .primary-btn:hover:not(:disabled) {
          background: var(--primary-hover);
        }
        .primary-btn:disabled {
          background: #F3F4F6;
          border-color: var(--border);
          color: var(--text-light);
          cursor: not-allowed;
          box-shadow: none;
        }
        .spin { animation: spin 1s linear infinite; }

        .kbd-hint {
          display: flex; align-items: center; gap: 4px;
          font-family: 'Inter', sans-serif; font-size: 12px; color: var(--text-muted);
        }
        .kbd-key {
          background: #F9FAFB; padding: 2px 6px; border-radius: 4px; border: 1px solid var(--border);
          font-family: 'JetBrains Mono', monospace; font-size: 11px;
        }

        /* Report Container */
        .report-container {
          margin-top: 40px;
          background: #fff;
          border: 1px solid var(--border);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
          border-radius: 4px;
        }

        .report-header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 16px 24px;
          border-bottom: 1px solid var(--border);
          background: #F9FAFB;
          border-radius: 4px 4px 0 0;
        }
        .report-title {
          font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-main); margin: 0;
        }
        .status-pill {
          font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.05em;
        }
        .status-pill.fail { background: #FEF2F2; color: #991B1B; border: 1px solid #FCA5A5; }
        .status-pill.pass { background: #F0FDF4; color: #166534; border: 1px solid #86EFAC; }

        .report-body { padding: 32px 24px; }

        .finding-section {
          margin-bottom: 32px;
        }
        .finding-label {
          font-size: 12px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; display: block;
        }
        .finding-text {
          font-size: 15px; color: var(--text-main); line-height: 1.6; margin: 0;
        }

        .reason-loading {
          opacity: 0.7;
          animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }

        .comparison-table {
          display: flex;
          border: 1px solid var(--border);
          border-radius: 4px;
          overflow: hidden;
        }
        .table-col { flex: 1; border-right: 1px solid var(--border); background: #fff; width: 50%; }
        .table-col:last-child { border-right: none; }
        
        .table-head {
          background: #F9FAFB; padding: 12px 16px; font-size: 12px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em;
          border-bottom: 1px solid var(--border);
        }
        .table-cell {
          padding: 16px;
        }
        .clause-text {
          font-family: 'Times New Roman', Times, serif; font-size: 16px; line-height: 1.6; color: var(--text-main); white-space: pre-wrap; margin: 0;
        }

        .report-footer {
          display: flex; gap: 24px; padding: 12px 24px; background: #F9FAFB; border-top: 1px solid var(--border); border-radius: 0 0 4px 4px;
        }
        .meta-item {
          font-family: 'JetBrains Mono', monospace; font-size: 11px; color: var(--text-muted); text-transform: uppercase;
        }

        @media (max-width: 900px) {
          .comparison-table { flex-direction: column; }
          .table-col { width: 100%; border-right: none; border-bottom: 1px solid var(--border); }
          .table-col:last-child { border-bottom: none; }
          .main-content { padding: 80px 20px 60px; }
        }
      `}</style>

      <nav className={`navbar ${fadeClass(0)}`}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={18} color="var(--primary)" />
          <h1 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-main)' }}>ScrutAuditor</h1>
          <span style={{ color: 'var(--border)', margin: '0 8px' }}>|</span>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Contract Analysis</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className={`status-dot ${modelStatus}`} />
          <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)' }}>{statusText}</span>
        </div>
      </nav>

      <main className="main-content" style={{ maxWidth: '1000px', margin: '0 auto', padding: '90px 32px 80px' }}>
        
        <div className={fadeClass(100)} style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-main)' }}>
            Audit Request
          </h2>
          <p style={{ fontSize: '15px', color: 'var(--text-muted)', margin: 0 }}>
            Compare active clauses against historical standards to identify material discrepancies.
          </p>
        </div>

        <div className={`panel ${fadeClass(200)}`} style={{ padding: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            
            {/* Clause A */}
            <div>
              <div className="input-label">
                <span>Current Clause</span>
                {clauseA && <button className="clear-btn" onClick={() => setClauseA('')}>Clear</button>}
              </div>
              <textarea
                className="scrut-textarea"
                placeholder="Enter the active clause under review..."
                value={clauseA}
                onChange={(e) => setClauseA(e.target.value)}
              />
            </div>

            {/* Clause B */}
            <div>
              <div className="input-label">
                <span>Historical Context</span>
                {clauseB && <button className="clear-btn" onClick={() => setClauseB('')}>Clear</button>}
              </div>
              <textarea
                className="scrut-textarea"
                placeholder="Enter the reference clause or baseline standard..."
                value={clauseB}
                onChange={(e) => setClauseB(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', gap: '16px', borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Load template:</span>
              <button className="demo-btn" onClick={() => {
                const pair = DEMOS.contradiction[Math.floor(Math.random() * DEMOS.contradiction.length)];
                setClauseA(pair.a); setClauseB(pair.b); setResult(null); setError(false);
              }}>Contradiction</button>
              <button className="demo-btn" onClick={() => {
                const pair = DEMOS.clear[Math.floor(Math.random() * DEMOS.clear.length)];
                setClauseA(pair.a); setClauseB(pair.b); setResult(null); setError(false);
              }}>Standard</button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {canRun && !isLoading && (
                <div className="kbd-hint">
                  <span className="kbd-key">{navigator.platform?.includes('Mac') ? '⌘' : 'Ctrl'}</span>
                  <span>+</span>
                  <span className="kbd-key">Enter</span>
                </div>
              )}
              <button 
                className="primary-btn" 
                disabled={!canRun || isLoading}
                onClick={runAnalysis}
              >
                {isLoading ? <><Loader size={16} className="spin" /> Auditing...</> : <>Run Audit <ArrowRight size={16} /></>}
              </button>
            </div>
          </div>
        </div>

        <div ref={resultRef} />

        {error && (
          <div className="fade-in-0 report-container" style={{ marginTop: '32px' }}>
            <div className="report-header">
               <h3 className="report-title">Audit Report</h3>
               <div className="status-pill fail">Error</div>
            </div>
            <div className="report-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#991B1B' }}>
                <AlertTriangle size={20} />
                <span style={{ fontSize: '15px', fontWeight: 500 }}>Failed to reach the inference engine. Please ensure the model is online.</span>
              </div>
            </div>
          </div>
        )}

        {result && (
          <div className="report-container fade-in-0">
            <div className="report-header">
              <h3 className="report-title">Audit Report</h3>
              <div className={`status-pill ${result.contradiction_found ? 'fail' : 'pass'}`}>
                {result.contradiction_found ? 'Requires Review' : 'Approved'}
              </div>
            </div>

            <div className="report-body">
              <div className="finding-section">
                <span className="finding-label">Finding</span>
                <p className="finding-text">
                  {reasonLoading ? (
                    <span className="reason-loading">Analyzing clause variations...</span>
                  ) : reason ? (
                    reason
                  ) : (
                    result.contradiction_found 
                      ? 'A material conflict exists between the proposed and historical clauses.' 
                      : 'No material conflict identified between the clauses.'
                  )}
                </p>
              </div>

              <div className="comparison-table">
                <div className="table-col">
                  <div className="table-head">Current Draft</div>
                  <div className="table-cell">
                    <p className="clause-text">{result.current_statement}</p>
                  </div>
                </div>
                <div className="table-col">
                  <div className="table-head">Historical Standard</div>
                  <div className="table-cell">
                    <p className="clause-text">{result.historical_statement}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="report-footer">
              <div className="meta-item">Model: Scrut-Auditor (8B)</div>
              <div className="meta-item">Environment: On-Premise</div>
              <div className="meta-item">Latency: {duration}ms</div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
