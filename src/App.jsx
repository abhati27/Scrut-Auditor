import { useState, useEffect, useRef } from 'react';
import { Shield, AlertTriangle, CheckCircle, Loader, Cpu, Command, Trash2 } from 'lucide-react';

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

  const resetAll = () => {
    setClauseA('');
    setClauseB('');
    setResult(null);
    setReason(null);
    setReasonLoading(false);
    setError(false);
    setDuration(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const canRun = clauseA.trim().length > 0 && clauseB.trim().length > 0;
  const statusText =
    modelStatus === 'active' ? 'MODEL ONLINE' : modelStatus === 'offline' ? 'MODEL OFFLINE' : 'CONNECTING...';

  const fadeClass = (delay) => (mounted ? `fade-in-${delay}` : 'initially-hidden');

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

        :root {
          --bg-base: #050505;
          --bg-panel: rgba(20, 20, 22, 0.7);
          --border: rgba(255, 255, 255, 0.1);
          --border-glow: rgba(255, 255, 255, 0.2);
          --text-main: #f8f8f8;
          --text-muted: #a1a1aa;
          --accent: #3b82f6;
          --accent-glow: rgba(59, 130, 246, 0.5);
          --danger: #ef4444;
          --danger-glow: rgba(239, 68, 68, 0.2);
          --success: #10b981;
          --success-glow: rgba(16, 185, 129, 0.2);
          --gradient-blue: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
        }

        *, *::before, *::after { box-sizing: border-box; }

        body {
          margin: 0;
          background-color: var(--bg-base);
          color: var(--text-main);
          font-family: 'Outfit', sans-serif;
          min-height: 100vh;
          overflow-x: hidden;
        }

        /* Abstract glowing orbs in background */
        body::before {
          content: '';
          position: fixed;
          top: -20%; left: -10%;
          width: 50vw; height: 50vw;
          background: radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(0,0,0,0) 70%);
          border-radius: 50%;
          z-index: -1;
          pointer-events: none;
        }
        body::after {
          content: '';
          position: fixed;
          bottom: -20%; right: -10%;
          width: 60vw; height: 60vw;
          background: radial-gradient(circle, rgba(139,92,246,0.1) 0%, rgba(0,0,0,0) 70%);
          border-radius: 50%;
          z-index: -1;
          pointer-events: none;
        }

        .glass-panel {
          background: var(--bg-panel);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid var(--border);
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          transition: border-color 0.3s ease, box-shadow 0.3s ease;
        }
        .glass-panel:hover {
          border-color: var(--border-glow);
        }

        h1, h2, h3, h4 { margin: 0; font-weight: 600; }

        @keyframes reveal {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-status {
          0%, 100% { opacity: 1; transform: scale(1); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
          50%      { opacity: 0.8; transform: scale(0.95); box-shadow: 0 0 10px 4px rgba(16, 185, 129, 0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes sweep {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }

        .initially-hidden { opacity: 0; }
        .fade-in-0   { animation: reveal 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0ms   both; }
        .fade-in-100 { animation: reveal 0.6s cubic-bezier(0.16, 1, 0.3, 1) 100ms both; }
        .fade-in-200 { animation: reveal 0.6s cubic-bezier(0.16, 1, 0.3, 1) 200ms both; }
        .fade-in-300 { animation: reveal 0.6s cubic-bezier(0.16, 1, 0.3, 1) 300ms both; }

        .status-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
        }
        .status-dot.active {
          background-color: var(--success);
          animation: pulse-status 2s infinite;
        }
        .status-dot.offline {
          background-color: var(--danger);
        }
        .status-dot.checking {
          background-color: var(--text-muted);
        }

        /* Nav */
        .navbar {
          position: fixed;
          top: 0; left: 0; right: 0;
          height: 70px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 5%;
          background: rgba(5, 5, 5, 0.5);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--border);
          z-index: 1000;
        }

        /* Textareas */
        .input-label {
          display: flex; justify-content: space-between; align-items: center;
          font-size: 13px; font-weight: 500; letter-spacing: 0.1em;
          color: var(--text-muted); text-transform: uppercase;
          margin-bottom: 12px;
        }
        .scrut-textarea {
          width: 100%;
          min-height: 220px;
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 20px;
          font-family: 'Outfit', sans-serif;
          font-size: 16px;
          line-height: 1.6;
          color: var(--text-main);
          resize: vertical;
          outline: none;
          transition: all 0.3s ease;
        }
        .scrut-textarea::placeholder { color: rgba(255, 255, 255, 0.2); }
        .scrut-textarea:focus {
          border-color: var(--accent);
          background: rgba(59, 130, 246, 0.03);
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
        }

        .clear-btn {
          background: none; border: none; cursor: pointer;
          color: var(--text-muted); transition: color 0.2s;
          display: flex; align-items: center; gap: 4px; font-size: 12px; font-family: 'Outfit';
        }
        .clear-btn:hover { color: var(--danger); }

        /* Buttons */
        .demo-btn {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border);
          color: var(--text-muted);
          padding: 8px 16px;
          border-radius: 30px;
          font-family: 'Outfit', sans-serif;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .demo-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: var(--text-main);
          border-color: rgba(255, 255, 255, 0.3);
        }

        .primary-btn {
          background: var(--gradient-blue);
          border: none;
          color: #fff;
          font-family: 'Outfit', sans-serif;
          font-size: 15px;
          font-weight: 600;
          letter-spacing: 0.05em;
          padding: 0 32px;
          height: 54px;
          border-radius: 12px;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 10px;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
          box-shadow: 0 4px 20px var(--accent-glow);
        }
        .primary-btn::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transform: translateX(-100%);
          transition: transform 0.5s ease;
        }
        .primary-btn:hover:not(:disabled)::before { transform: translateX(100%); }
        .primary-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 25px var(--accent-glow);
        }
        .primary-btn:disabled {
          background: #2a2a2a;
          color: #666;
          box-shadow: none;
          cursor: not-allowed;
        }
        .spin { animation: spin 1s linear infinite; }

        .kbd-hint {
          display: flex; align-items: center; gap: 4px;
          font-family: 'JetBrains Mono', monospace; font-size: 12px; color: var(--text-muted);
        }
        .kbd-key {
          background: rgba(255, 255, 255, 0.1); padding: 2px 6px; border-radius: 4px; border: 1px solid var(--border);
        }

        /* Result Card */
        .result-card {
          margin-top: 40px;
          padding: 32px;
          border-radius: 20px;
          position: relative;
          overflow: hidden;
        }
        .result-card::before {
          content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 4px;
        }
        .result-card.contradiction {
          background: linear-gradient(180deg, rgba(239, 68, 68, 0.05) 0%, var(--bg-panel) 100%);
          border: 1px solid rgba(239, 68, 68, 0.2);
          box-shadow: 0 20px 40px rgba(239, 68, 68, 0.05);
        }
        .result-card.contradiction::before { background: var(--danger); }
        
        .result-card.clear {
          background: linear-gradient(180deg, rgba(16, 185, 129, 0.05) 0%, var(--bg-panel) 100%);
          border: 1px solid rgba(16, 185, 129, 0.2);
          box-shadow: 0 20px 40px rgba(16, 185, 129, 0.05);
        }
        .result-card.clear::before { background: var(--success); }

        .result-title {
          font-size: 32px; font-weight: 700; letter-spacing: -0.02em; display: flex; align-items: center; gap: 12px; margin-bottom: 16px;
        }
        .contradiction .result-title { color: var(--danger); }
        .clear .result-title { color: var(--success); }

        .result-reason {
          font-size: 18px; line-height: 1.6; color: rgba(255,255,255,0.9);
          padding: 20px; background: rgba(0,0,0,0.3); border-radius: 12px;
          border-left: 3px solid; margin-bottom: 32px;
        }
        .contradiction .result-reason { border-left-color: var(--danger); }
        .clear .result-reason { border-left-color: var(--success); }

        .reason-loading {
          background: linear-gradient(90deg, var(--text-muted) 0%, #fff 50%, var(--text-muted) 100%);
          background-size: 200% auto;
          color: transparent;
          -webkit-background-clip: text;
          animation: sweep 2s linear infinite;
        }

        .diff-view { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        .diff-box {
          background: rgba(0,0,0,0.2); border: 1px solid var(--border); border-radius: 12px; padding: 20px;
        }
        .diff-label { font-size: 12px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 12px; display: block; }
        .diff-content { font-size: 15px; line-height: 1.6; color: var(--text-muted); white-space: pre-wrap; font-family: 'Outfit'; margin: 0; }
        
        .metadata-bar {
          display: flex; align-items: center; gap: 24px; margin-top: 32px; padding-top: 24px; border-top: 1px solid var(--border);
          font-family: 'JetBrains Mono', monospace; font-size: 12px; color: var(--text-muted);
        }

        @media (max-width: 900px) {
          .diff-view { grid-template-columns: 1fr; }
          .main-content { padding: 100px 5% 60px; }
        }
      `}</style>

      <nav className={`navbar ${fadeClass(0)}`}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'var(--gradient-blue)', padding: '8px', borderRadius: '10px' }}>
            <Shield size={20} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: '20px', letterSpacing: '-0.02em', color: '#fff' }}>ScrutAuditor</h1>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Legal Inference Engine</div>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.05)', padding: '8px 16px', borderRadius: '30px', border: '1px solid var(--border)' }}>
          <div className={`status-dot ${modelStatus}`} />
          <span style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em', color: 'var(--text-muted)' }}>{statusText}</span>
        </div>
      </nav>

      <main className="main-content" style={{ maxWidth: '1200px', margin: '0 auto', padding: '120px 5% 80px' }}>
        
        <div className={fadeClass(100)} style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h2 style={{ fontSize: '48px', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: '16px' }}>
            Autonomous <span style={{ background: 'var(--gradient-blue)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Contract Auditing</span>
          </h2>
          <p style={{ fontSize: '18px', color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto', lineHeight: 1.6 }}>
            Identify hidden contradictions and conflicting liabilities between current and historical clauses using our fine-tuned 8B parameter model.
          </p>
        </div>

        <div className={`glass-panel ${fadeClass(200)}`} style={{ padding: '32px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            
            {/* Clause A */}
            <div>
              <div className="input-label">
                <span>Current Clause</span>
                {clauseA && <button className="clear-btn" onClick={() => setClauseA('')}><Trash2 size={12} /> Clear</button>}
              </div>
              <textarea
                className="scrut-textarea"
                placeholder="Paste the active clause under review here..."
                value={clauseA}
                onChange={(e) => setClauseA(e.target.value)}
              />
            </div>

            {/* Clause B */}
            <div>
              <div className="input-label">
                <span>Historical Context</span>
                {clauseB && <button className="clear-btn" onClick={() => setClauseB('')}><Trash2 size={12} /> Clear</button>}
              </div>
              <textarea
                className="scrut-textarea"
                placeholder="Paste the reference clause or historical standard here..."
                value={clauseB}
                onChange={(e) => setClauseB(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginTop: '32px', gap: '20px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>Try an example:</span>
              <button className="demo-btn" onClick={() => {
                const pair = DEMOS.contradiction[Math.floor(Math.random() * DEMOS.contradiction.length)];
                setClauseA(pair.a); setClauseB(pair.b); setResult(null); setError(false);
              }}>Contradiction</button>
              <button className="demo-btn" onClick={() => {
                const pair = DEMOS.clear[Math.floor(Math.random() * DEMOS.clear.length)];
                setClauseA(pair.a); setClauseB(pair.b); setResult(null); setError(false);
              }}>Standard</button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
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
                {isLoading ? <><Loader size={18} className="spin" /> Auditing...</> : <><Sparkles size={18} /> Run Audit</>}
              </button>
            </div>
          </div>
        </div>

        <div ref={resultRef} />

        {error && (
          <div className="fade-in-0 glass-panel" style={{ marginTop: '40px', padding: '24px', border: '1px solid var(--danger)', background: 'var(--danger-glow)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--danger)' }}>
              <AlertTriangle size={24} />
              <p style={{ margin: 0, fontSize: '16px', fontWeight: 500 }}>Connection to the inference engine failed. Please ensure the model is online and try again.</p>
            </div>
          </div>
        )}

        {result && (
          <div className={`result-card glass-panel fade-in-0 ${result.contradiction_found ? 'contradiction' : 'clear'}`}>
            <div className="result-title">
              {result.contradiction_found ? <><AlertTriangle size={36} /> Critical Contradiction Detected</> : <><CheckCircle size={36} /> Clauses Aligned</>}
            </div>

            <div className="result-reason">
              {reasonLoading ? (
                <span className="reason-loading">Synthesizing rationale from the 8B parameter model...</span>
              ) : reason ? (
                reason
              ) : (
                result.contradiction_found ? 'A material discrepancy exists between the obligations in these clauses.' : 'No direct conflict in obligations was found during the audit.'
              )}
            </div>

            <div className="diff-view">
              <div className="diff-box">
                <span className="diff-label">Current Statement</span>
                <pre className="diff-content">{result.current_statement}</pre>
              </div>
              <div className="diff-box">
                <span className="diff-label">Historical Statement</span>
                <pre className="diff-content">{result.historical_statement}</pre>
              </div>
            </div>

            <div className="metadata-bar">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Cpu size={14} /> SCRUT-AUDITOR:LATEST</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Server size={14} /> ON-PREMISE</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Command size={14} /> {duration}MS</div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
