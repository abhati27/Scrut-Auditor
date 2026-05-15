import { useState, useEffect, useRef } from 'react';
import { Shield, AlertTriangle, CheckCircle, Loader, Minus } from 'lucide-react';

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
    {
      a: 'This agreement shall automatically renew for successive one-year terms unless either party provides sixty days written notice of non-renewal prior to expiration.',
      b: 'This agreement shall expire at the end of its initial term and shall not renew automatically. Any renewal requires the parties to execute a new written agreement.',
    },
    {
      a: 'Upon termination the employee shall not work for any direct competitor or start a competing business within the defined territory for two years.',
      b: 'Upon termination the employee is entirely free to work for any employer including direct competitors and to start any business, with no geographic or time restriction.',
    },
    {
      a: 'No late fees, penalties, or interest charges shall be assessed on any overdue balances under any circumstances whatsoever.',
      b: 'All amounts unpaid after the due date shall accrue a late payment charge of two percent per month on the outstanding balance until paid in full.',
    },
    {
      a: 'All fees paid under this agreement are non-refundable and no refund shall be issued upon cancellation or termination for any reason.',
      b: 'Client is entitled to a full refund of all prepaid fees upon termination of this agreement, payable within thirty days of the termination date.',
    },
    {
      a: 'Contractor shall not subcontract any portion of the work without prior written approval from Client.',
      b: 'Contractor may subcontract any portion of the work to qualified third parties without requiring Client consent.',
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
    {
      a: 'Each party shall indemnify and hold harmless the other from any third-party claims arising from its own negligence or willful misconduct.',
      b: 'Both parties agree to defend and indemnify one another against any losses, claims, or liabilities caused by that party\'s negligent acts or intentional wrongdoing.',
    },
    {
      a: 'This agreement constitutes the entire agreement between the parties with respect to its subject matter and supersedes all prior negotiations, representations, and understandings.',
      b: 'This contract represents the complete and final agreement of the parties on the matters addressed herein, replacing any prior discussions, drafts, or representations whether written or oral.',
    },
    {
      a: 'If any provision of this agreement is held to be invalid or unenforceable, the remaining provisions shall continue in full force and effect.',
      b: 'Should any clause of this contract be found void or unenforceable by a court of competent jurisdiction, the rest of the agreement shall remain valid and binding on the parties.',
    },
    {
      a: 'The receiving party shall hold all confidential information in strict confidence for three years following the date of disclosure.',
      b: 'Confidential information exchanged under this agreement shall be protected from unauthorized disclosure for a period of three years from the date it was shared.',
    },
    {
      a: 'The contractor shall maintain commercial general liability insurance with a minimum of two million dollars per occurrence throughout the contract term.',
      b: 'Contractor must carry general liability insurance of no less than two million dollars per occurrence for the full duration of this agreement.',
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

  const padCount = (n) => String(n).padStart(3, '0');
  const canRun = clauseA.trim().length > 0 && clauseB.trim().length > 0;
  const statusText =
    modelStatus === 'active' ? 'INFERENCE ACTIVE' : modelStatus === 'offline' ? 'OFFLINE' : 'CHECKING';

  const fadeClass = (delay) => (mounted ? `fade-in-${delay}` : 'initially-hidden');

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&family=IBM+Plex+Mono:wght@300;400;500&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap');

        :root {
          --ink:        #0e0e0e;
          --ink-light:  #1a1a1a;
          --ink-mid:    #2a2a2a;
          --rule:       #2e2e2e;
          --rule-light: #3d3d3d;
          --fog:        #5c5c5c;
          --mist:       #888888;
          --paper:      #b8b8b8;
          --offwhite:   #d6d6d6;
          --white:      #efefef;
          --amber:      #c8922a;
          --amber-mute: #7a5518;
          --amber-dim:  #1a1208;
          --green:      #3d9e5f;
          --green-mute: #245c38;
          --green-dim:  #0a1f12;
          --red:        #c0392b;
          --red-dim:    #1c0a09;
        }

        *, *::before, *::after { box-sizing: border-box; }

        body {
          margin: 0;
          background-color: var(--ink);
          color: var(--white);
          min-height: 100vh;
        }

        body::before {
          content: '';
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 9999;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E");
          opacity: 0.03;
        }

        #root { all: unset; display: block; }

        @keyframes breathe {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(0.85); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes reveal {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .initially-hidden { opacity: 0; }
        .fade-in-0   { animation: reveal 300ms ease-out 0ms   both; }
        .fade-in-60  { animation: reveal 300ms ease-out 60ms  both; }
        .fade-in-120 { animation: reveal 300ms ease-out 120ms both; }
        .fade-in-180 { animation: reveal 300ms ease-out 180ms both; }
        .fade-in-240 { animation: reveal 300ms ease-out 240ms both; }

        .breathe { animation: breathe 3s ease-in-out infinite; }
        .spin     { animation: spin 1s linear infinite; }
        .reveal   { animation: reveal 300ms ease-out forwards; }

        /* Textarea */
        .scrut-textarea {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 13px;
          line-height: 2.0;
          color: var(--offwhite);
          background: var(--ink-light);
          border: 1px solid var(--rule);
          border-radius: 0;
          padding: 16px;
          min-height: 200px;
          width: 100%;
          resize: vertical;
          outline: none;
          transition: border-color 120ms ease;
          display: block;
        }
        .scrut-textarea::placeholder { color: var(--fog); }
        .textarea-a { caret-color: var(--amber); }
        .textarea-b { caret-color: var(--offwhite); }
        .textarea-a:focus { border-color: var(--amber-mute); }
        .textarea-b:focus { border-color: var(--rule-light); }

        /* Clear button */
        .clear-btn {
          background: none;
          border: none;
          padding: 0 0 0 8px;
          cursor: pointer;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          color: var(--fog);
          line-height: 1;
          transition: color 120ms ease;
          flex-shrink: 0;
        }
        .clear-btn:hover { color: var(--offwhite); }

        /* Demo options */
        .demo-group {
          display: flex;
          align-items: center;
          gap: 0;
          flex-wrap: wrap;
          row-gap: 4px;
        }
        .demo-prefix {
          font-family: 'IBM Plex Sans', sans-serif;
          font-size: 11px;
          letter-spacing: 0.1em;
          color: var(--fog);
          text-transform: uppercase;
          margin-right: 12px;
          flex-shrink: 0;
        }
        .demo-btn {
          font-family: 'IBM Plex Sans', sans-serif;
          font-size: 12px;
          color: var(--mist);
          background: none;
          border: none;
          border-bottom: 1px solid var(--rule);
          padding: 0 0 1px 0;
          cursor: pointer;
          transition: color 120ms ease, border-color 120ms ease;
          margin-right: 16px;
        }
        .demo-btn:last-child { margin-right: 0; }
        .demo-btn:hover { color: var(--offwhite); border-color: var(--mist); }
        .demo-btn.contradiction-btn:hover { color: var(--amber); border-color: var(--amber-mute); }
        .demo-btn.clear-btn-demo:hover { color: var(--green); border-color: var(--green-mute); }

        /* Keyboard hint */
        .kbd-hint {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          color: var(--fog);
          letter-spacing: 0.05em;
          border: 1px solid var(--rule);
          padding: 1px 5px;
          border-radius: 0;
        }

        /* Run button */
        .run-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 200px;
          height: 40px;
          background: transparent;
          border: 1px solid var(--amber);
          border-radius: 0;
          font-family: 'IBM Plex Sans', sans-serif;
          font-size: 11px;
          letter-spacing: 0.25em;
          font-weight: 600;
          color: var(--amber);
          text-transform: uppercase;
          cursor: pointer;
          transition: background 120ms ease, color 120ms ease;
        }
        .run-btn:hover:not(:disabled):not(.loading) {
          background: var(--amber);
          color: var(--ink);
        }
        .run-btn:disabled, .run-btn.loading {
          border-color: var(--rule);
          color: var(--fog);
          cursor: not-allowed;
        }
        .run-btn.loading { cursor: default; }

        /* Reset link */
        .reset-link {
          font-family: 'IBM Plex Sans', sans-serif;
          font-size: 12px;
          color: var(--fog);
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
          transition: color 120ms ease;
          text-decoration: none;
        }
        .reset-link:hover { color: var(--mist); text-decoration: underline; }

        @keyframes pulse-text {
          0%, 100% { opacity: 0.4; }
          50%       { opacity: 0.8; }
        }
        .reason-loading {
          animation: pulse-text 1.8s ease-in-out infinite;
          font-style: italic;
        }
        .reason-text {
          animation: reveal 300ms ease-out forwards;
        }

        /* Rules */
        .h-rule {
          border: none;
          border-top: 1px solid var(--rule);
          width: 100%;
          margin: 0;
        }
        .divider-rule {
          border: none;
          border-top: 1px solid var(--rule);
          flex: 1;
        }

        /* Pre blocks */
        .scrut-pre {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 13px;
          line-height: 2.0;
          color: var(--offwhite);
          background: var(--ink-light);
          border: 1px solid var(--rule);
          border-radius: 0;
          padding: 16px;
          white-space: pre-wrap;
          word-break: break-word;
          margin: 0;
        }

        /* Layout */
        .main-wrap {
          max-width: 960px;
          margin: 0 auto;
          padding: 0 48px;
        }
        .two-col {
          display: flex;
          gap: 16px;
        }
        .two-col > * { flex: 1; min-width: 0; }

        .action-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 32px;
          gap: 16px;
        }
        .action-right {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
        }

        .footer-inner {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 16px;
        }

        @media (max-width: 767px) {
          .main-wrap { padding: 0 24px; }
          .two-col { flex-direction: column; gap: 16px; }
          .two-col > * { width: 100%; }
          .run-btn { width: 100%; }
          .action-row { flex-direction: column; align-items: flex-start; }
          .action-right { width: 100%; justify-content: flex-end; }
          .footer-inner { flex-direction: column; gap: 8px; align-items: center; }
          .kbd-hint { display: none; }
        }
      `}</style>

      {/* Fixed Header */}
      <header
        className={fadeClass(0)}
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0,
          height: '52px',
          backgroundColor: 'var(--ink-light)',
          borderBottom: '1px solid var(--rule)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 48px',
          zIndex: 1000,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={14} color="var(--amber)" strokeWidth={2} />
          <span style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: '17px',
            letterSpacing: '0.04em',
            color: 'var(--white)',
            fontWeight: 700,
          }}>SCRUT</span>
          <Minus size={12} color="var(--rule-light)" style={{ transform: 'rotate(90deg)', display: 'block' }} />
          <span style={{
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: '10px',
            letterSpacing: '0.35em',
            fontWeight: 500,
            color: 'var(--fog)',
            textTransform: 'uppercase',
          }}>AUDITOR</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            className={modelStatus === 'active' ? 'breathe' : ''}
            style={{
              width: '7px', height: '7px',
              borderRadius: '50%',
              backgroundColor:
                modelStatus === 'active' ? 'var(--green)'
                : modelStatus === 'offline' ? 'var(--red)'
                : 'var(--rule-light)',
              flexShrink: 0,
            }}
          />
          <span style={{
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: '11px',
            letterSpacing: '0.08em',
            color: 'var(--mist)',
            textTransform: 'uppercase',
          }}>{statusText}</span>
        </div>
      </header>

      <main className="main-wrap" style={{ paddingTop: '52px' }}>

        {/* Section 1: Header Block */}
        <div className={fadeClass(60)} style={{ paddingTop: '56px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px' }}>
            <span style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: '11px',
              color: 'var(--fog)',
              letterSpacing: '0.1em',
              lineHeight: 1,
              flexShrink: 0,
            }}>01</span>
            <span style={{
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontSize: '10px',
              letterSpacing: '0.3em',
              color: 'var(--fog)',
              textTransform: 'uppercase',
              lineHeight: 1,
            }}>CLAUSE INPUT</span>
          </div>
          <hr className="h-rule" style={{ marginTop: '8px' }} />
        </div>

        {/* Section 2: Input Zone */}
        <div className={`two-col ${fadeClass(120)}`} style={{ marginTop: '24px' }}>

          {/* Panel A */}
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px',
            }}>
              <span style={{
                fontFamily: "'IBM Plex Sans', sans-serif",
                fontSize: '10px',
                letterSpacing: '0.2em',
                color: 'var(--amber)',
                textTransform: 'uppercase',
                fontWeight: 500,
              }}>A — CURRENT CLAUSE</span>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: '10px',
                  color: 'var(--fog)',
                }}>{padCount(clauseA.length)} chars</span>
                {clauseA.length > 0 && (
                  <button
                    className="clear-btn"
                    onClick={() => setClauseA('')}
                    type="button"
                    title="Clear"
                    aria-label="Clear current clause"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
            <textarea
              className="scrut-textarea textarea-a"
              aria-label="Current clause input"
              value={clauseA}
              onChange={(e) => setClauseA(e.target.value)}
              placeholder="Enter current clause text..."
            />
            <div style={{
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontSize: '11px',
              color: 'var(--fog)',
              marginTop: '6px',
            }}>The clause under review</div>
          </div>

          {/* Panel B */}
          <div className={fadeClass(180)}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px',
            }}>
              <span style={{
                fontFamily: "'IBM Plex Sans', sans-serif",
                fontSize: '10px',
                letterSpacing: '0.2em',
                color: 'var(--mist)',
                textTransform: 'uppercase',
                fontWeight: 500,
              }}>B — HISTORICAL CLAUSE</span>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: '10px',
                  color: 'var(--fog)',
                }}>{padCount(clauseB.length)} chars</span>
                {clauseB.length > 0 && (
                  <button
                    className="clear-btn"
                    onClick={() => setClauseB('')}
                    type="button"
                    title="Clear"
                    aria-label="Clear historical clause"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
            <textarea
              className="scrut-textarea textarea-b"
              aria-label="Historical clause input"
              value={clauseB}
              onChange={(e) => setClauseB(e.target.value)}
              placeholder="Enter historical clause text..."
            />
            <div style={{
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontSize: '11px',
              color: 'var(--fog)',
              marginTop: '6px',
            }}>The reference or baseline clause</div>
          </div>
        </div>

        {/* Section 3: Action Row */}
        <div className={`action-row ${fadeClass(240)}`}>

          {/* Left: demo options */}
          <div className="demo-group">
            <span className="demo-prefix">Example</span>
            <button
              className="demo-btn contradiction-btn"
              type="button"
              onClick={() => {
                const pair = DEMOS.contradiction[Math.floor(Math.random() * DEMOS.contradiction.length)];
                setClauseA(pair.a);
                setClauseB(pair.b);
                setResult(null);
                setError(false);
              }}
            >
              Contradiction
            </button>
            <button
              className="demo-btn clear-btn-demo"
              type="button"
              onClick={() => {
                const pair = DEMOS.clear[Math.floor(Math.random() * DEMOS.clear.length)];
                setClauseA(pair.a);
                setClauseB(pair.b);
                setResult(null);
                setError(false);
              }}
            >
              No Contradiction
            </button>
          </div>

          {/* Right: keyboard hint + run button */}
          <div className="action-right">
            {canRun && !isLoading && (
              <span className="kbd-hint">
                {navigator.platform?.includes('Mac') ? '⌘' : 'Ctrl'} + Return
              </span>
            )}
            <button
              className={`run-btn${isLoading ? ' loading' : ''}`}
              disabled={!canRun || isLoading}
              aria-disabled={!canRun || isLoading}
              onClick={runAnalysis}
              type="button"
            >
              {isLoading ? (
                <><Loader size={14} className="spin" /> AUDITING</>
              ) : 'RUN ANALYSIS'}
            </button>
          </div>
        </div>

        {/* Anchor for scroll target */}
        <div ref={resultRef} style={{ marginTop: '32px' }} />

        {/* Section 6: Error State */}
        {error && (
          <div style={{
            borderLeft: '3px solid var(--red)',
            backgroundColor: 'var(--red-dim)',
            padding: '14px 18px',
          }}>
            <p style={{
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontSize: '13px',
              color: 'var(--red)',
              lineHeight: 1.6,
              margin: 0,
            }}>
              Analysis failed. Confirm the inference model is running at the expected endpoint and retry.
            </p>
          </div>
        )}

        {/* Section 4 + 5: Divider + Results */}
        {result && (
          <div className="reveal">

            {/* Section 4: Divider */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              margin: '8px 0 32px',
            }}>
              <hr className="divider-rule" />
              <span style={{
                fontFamily: "'IBM Plex Sans', sans-serif",
                fontSize: '9px',
                letterSpacing: '0.35em',
                color: 'var(--fog)',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
              }}>AUDIT RESULT</span>
              <hr className="divider-rule" />
            </div>

            {/* 5a: Verdict Block */}
            <div
              role="status"
              aria-live="polite"
              style={{
                position: 'relative',
                backgroundColor: result.contradiction_found ? 'var(--amber-dim)' : 'var(--green-dim)',
                borderTop: `1px solid ${result.contradiction_found ? 'var(--amber-mute)' : 'var(--green-mute)'}`,
                borderBottom: `1px solid ${result.contradiction_found ? 'var(--amber-mute)' : 'var(--green-mute)'}`,
                padding: '28px 28px 28px 24px',
              }}
            >
              <div style={{
                position: 'absolute',
                left: 0, top: 0, bottom: 0,
                width: '3px',
                backgroundColor: result.contradiction_found ? 'var(--amber)' : 'var(--green)',
              }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                {result.contradiction_found
                  ? <AlertTriangle size={16} color="var(--amber)" strokeWidth={1.5} />
                  : <CheckCircle size={16} color="var(--green)" strokeWidth={1.5} />
                }
                <h2 style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: '32px',
                  fontStyle: 'italic',
                  fontWeight: 700,
                  color: result.contradiction_found ? 'var(--amber)' : 'var(--green)',
                  lineHeight: 1.1,
                  margin: 0,
                }}>
                  {result.contradiction_found ? 'Contradiction Detected' : 'No Contradiction Detected'}
                </h2>
              </div>

              <p style={{
                fontFamily: "'IBM Plex Sans', sans-serif",
                fontSize: '14px',
                lineHeight: 1.7,
                margin: 0,
                color: reasonLoading ? 'var(--fog)' : 'var(--paper)',
              }}>
                {reasonLoading ? (
                  <span className="reason-loading">Analyzing rationale...</span>
                ) : reason ? (
                  <span className="reason-text">{reason}</span>
                ) : (
                  result.contradiction_found
                    ? 'The two clauses are in direct conflict. Legal review is required before execution.'
                    : 'The audit model found no conflicting obligations between these clauses.'
                )}
              </p>
            </div>

            {/* 5b: Clause Display */}
            <div style={{ marginTop: '40px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px' }}>
                <span style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: '11px',
                  color: 'var(--fog)',
                  letterSpacing: '0.1em',
                  lineHeight: 1,
                  flexShrink: 0,
                }}>02</span>
                <span style={{
                  fontFamily: "'IBM Plex Sans', sans-serif",
                  fontSize: '10px',
                  letterSpacing: '0.3em',
                  color: 'var(--fog)',
                  textTransform: 'uppercase',
                  lineHeight: 1,
                }}>REVIEWED CLAUSES</span>
              </div>
              <hr className="h-rule" style={{ marginTop: '8px', marginBottom: '24px' }} />

              <div className="two-col">
                <div>
                  <div style={{ marginBottom: '8px' }}>
                    <span style={{
                      fontFamily: "'IBM Plex Sans', sans-serif",
                      fontSize: '10px',
                      letterSpacing: '0.2em',
                      color: 'var(--amber)',
                      textTransform: 'uppercase',
                      fontWeight: 500,
                    }}>A — CURRENT CLAUSE</span>
                  </div>
                  <pre className="scrut-pre">{result.current_statement}</pre>
                </div>

                <div>
                  <div style={{ marginBottom: '8px' }}>
                    <span style={{
                      fontFamily: "'IBM Plex Sans', sans-serif",
                      fontSize: '10px',
                      letterSpacing: '0.2em',
                      color: 'var(--mist)',
                      textTransform: 'uppercase',
                      fontWeight: 500,
                    }}>B — HISTORICAL CLAUSE</span>
                  </div>
                  <pre className="scrut-pre">{result.historical_statement}</pre>
                </div>
              </div>
            </div>

            {/* 5c: Metadata + Reset */}
            <div style={{ marginTop: '24px' }}>
              <p style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '10px',
                color: 'var(--fog)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                margin: 0,
              }}>
                MODEL: SCRUT-AUDITOR:LATEST{'   '}|{'   '}PARAMS: 8B{'   '}|{'   '}QUANT: Q4_K_M{'   '}|{'   '}MODE: ON-PREMISE{'   '}|{'   '}DURATION: {duration}MS
              </p>
              <div style={{ textAlign: 'right', marginTop: '12px' }}>
                <button className="reset-link" onClick={resetAll} type="button">
                  Run new analysis
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Section 7: Footer */}
        <footer style={{ paddingTop: '64px', paddingBottom: '40px' }}>
          <hr className="h-rule" />
          <div className="footer-inner">
            <span style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '10px',
              color: 'var(--fog)',
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
            }}>SCRUT AUDITOR — ON-PREMISE LEGAL INFERENCE</span>
            <span style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '10px',
              color: 'var(--fog)',
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
            }}>SCRUT-AUDITOR:LATEST — LLAMA 3 8B — Q4_K_M</span>
          </div>
        </footer>

      </main>
    </>
  );
}
