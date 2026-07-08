// frontend/src/App.jsx
import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Shield, Cpu, AlertTriangle, RotateCcw, Award, ArrowRight, Activity, Zap, Layers } from 'lucide-react';

const API_BASE = "https://ecotrack-api-mqgg.onrender.com";

function App() {
  const [entered, setEntered] = useState(false);
  const [status, setStatus] = useState(null);
  const [hour, setHour] = useState(12);
  const [loading, setLoading] = useState(false);
  const [retrainOutput, setRetrainOutput] = useState(null);
  const [showLedger, setShowLedger] = useState(false);

  // Fetch status on hourly slide change or actions
  const fetchStatus = async (currentHour = hour) => {
    try {
      const res = await fetch(`${API_BASE}/status?hour=${currentHour}`);
      const data = await res.json();
      setStatus(data);
    } catch (e) {
      console.error("Error fetching status from FastAPI:", e);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleHourChange = (e) => {
    const val = parseInt(e.target.value);
    setHour(val);
    fetchStatus(val);
  };

  const handleInject = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/inject`, { method: "POST" });
      await res.json();
      await fetchStatus();
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleRequestRetrain = () => {
    setShowLedger(true);
    setRetrainOutput(null);
  };

  const handleRetrain = async (override = false) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/retrain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hour, override })
      });
      const data = await res.json();
      if (data.status === "blocked") {
        alert(data.message);
      } else {
        setRetrainOutput(data);
        await fetchStatus();
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleRollback = async (version) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/rollback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version })
      });
      await res.json();
      setRetrainOutput(null);
      setShowLedger(false);
      await fetchStatus();
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleReset = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/reset`, { method: "POST" });
      await res.json();
      setRetrainOutput(null);
      setShowLedger(false);
      await fetchStatus();
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  if (!status) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#080b10', color: '#fff' }}>
        <h2>Loading EcoTrack Core Engine Status...</h2>
      </div>
    );
  }

  // Render 🌟 Premium Landing Page
  if (!entered) {
    return (
      <div style={{
        background: 'radial-gradient(circle at top, rgba(16, 185, 129, 0.08), #080b10 80%)',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Glowing Ambient Orbs */}
        <div className="glow-orb glow-orb-green" />
        <div className="glow-orb glow-orb-blue" />

        <div style={{ maxWidth: '950px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem', zIndex: 1 }}>
          <div className="animated-float-1" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(16, 185, 129, 0.08)', padding: '0.5rem 1.25rem', borderRadius: '40px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <span className="status-indicator-dot" />
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#10b981', letterSpacing: '0.05em' }}>ENVIRONMENTAL MLOps GOVERNANCE ACTIVATED</span>
          </div>

          <h1 style={{ fontSize: '4rem', margin: 0, fontWeight: 800, letterSpacing: '-0.02em', background: 'linear-gradient(135deg, #ffffff 30%, #94a3b8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: '1.1' }}>
            EcoTrack MLOps Governance Tower
          </h1>
          
          <p style={{ fontSize: '1.25rem', color: '#94a3b8', lineHeight: '1.6', margin: 0, maxWidth: '750px' }}>
            A carbon-aware MLOps middleware simulating real-time environmental cost compliance. EcoTrack audits grid emissions, prevents carbon-heavy training cycles, and executes tournament validation before model promotion.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', width: '100%', marginTop: '1.5rem' }}>
            <div className="feature-card-interactive animated-float-2">
              <Zap size={32} color="#60a5fa" style={{ marginBottom: '1rem' }} />
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', color: '#ffffff' }}>Eco-Gate Compliance</h3>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#94a3b8', lineHeight: '1.5' }}>
                Monitors regional grid hour carbon intensity (gCO2/kWh) and resource overhead (water cooling loss), dynamically blocking retraining during peak grid hours.
              </p>
            </div>
            
            <div className="feature-card-interactive animated-float-3">
              <Layers size={32} color="#10b981" style={{ marginBottom: '1rem' }} />
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', color: '#ffffff' }}>Tournament Battle Duel</h3>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#94a3b8', lineHeight: '1.5' }}>
                Tests fresh challengers against production models on isolated drift slices. Automatic hot-swaps occur only if the challenger outperforms active models.
              </p>
            </div>

            <div className="feature-card-interactive animated-float-1">
              <Activity size={32} color="#f59e0b" style={{ marginBottom: '1rem' }} />
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', color: '#ffffff' }}>Rollback Registry Engine</h3>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#94a3b8', lineHeight: '1.5' }}>
                Integrated with a MongoDB model registry database, permitting instant rollbacks that revert both the active weights and the corresponding data state.
              </p>
            </div>
          </div>

          <div style={{ marginTop: '2rem' }}>
            <button className="glowing-btn" onClick={() => setEntered(true)}>
              Launch Control Tower <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render 📊 Dashboard Page
  let statusClass = "status-healthy";
  if (status.status_state === "DEGRADED") statusClass = "status-degraded";
  if (status.status_state === "DRIFT DETECTED") statusClass = "status-critical";

  return (
    <div className="dashboard-container">
      {/* ⚙️ Sidebar Panel */}
      <div className="sidebar">
        <div>
          <h2 style={{ margin: '0 0 0.5rem 0', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Shield size={24} /> EcoTrack
          </h2>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>MLOps Carbon-Aware Core</span>
          
          <button className="btn btn-secondary" style={{ marginTop: '1.5rem', fontSize: '0.85rem', padding: '0.5rem' }} onClick={() => setEntered(false)}>
            <RotateCcw size={14} /> Back to Welcome Portal
          </button>
        </div>

        <hr style={{ borderColor: 'rgba(255, 255, 255, 0.08)', width: '100%', margin: '0.75rem 0' }} />

        <div className="slider-container">
          <label className="metric-label">Grid hour timeline: {hour}:00</label>
          <input
            type="range"
            min="0"
            max="23"
            value={hour}
            onChange={handleHourChange}
            className="custom-slider"
          />
        </div>

        <hr style={{ borderColor: 'rgba(255, 255, 255, 0.08)', width: '100%' }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <button className="btn btn-secondary" onClick={handleInject} disabled={loading}>
            <AlertTriangle size={18} /> Inject 2026 Drift
          </button>
          
          <button className="btn" onClick={handleRequestRetrain} disabled={loading}>
            <Cpu size={18} /> Retrain Pipeline
          </button>

          <button className="btn btn-danger" onClick={handleReset} disabled={loading}>
            <RotateCcw size={18} /> Reset System
          </button>
        </div>
      </div>

      {/* 📊 Main Content Dashboard */}
      <div className="main-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, fontWeight: 700 }}>MLOps Environmental Control Tower</h1>
            <p style={{ margin: '0.5rem 0 0 0', color: '#64748b' }}>Live production prediction monitoring & compliance ledger</p>
          </div>
          <div className="glass-card" style={{ padding: '0.5rem 1rem' }}>
            <span className="metric-label">Deployed Model: </span>
            <span style={{ fontWeight: 'bold', color: '#60a5fa' }}>{status.active_version}</span>
          </div>
        </div>

        {/* Graph Component */}
        <div className="glass-card" style={{ height: '350px' }}>
          <h3 style={{ margin: '0 0 1rem 0' }}>📈 Time-Series Inference Deviation Matrix (AQI vs Predicted)</h3>
          <ResponsiveContainer width="100%" height="90%">
            <LineChart data={status.chart_data}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="index" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip contentStyle={{ backgroundColor: '#0d1117', border: '1px solid rgba(255,255,255,0.08)' }} />
              <Legend />
              <Line type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={2} name="Actual AQI" dot={false} activeDot={{ r: 8 }} />
              <Line type="monotone" dataKey="predicted" stroke="#3b82f6" strokeWidth={2} name="Model Prediction" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Metric Cards Grid */}
        <div className="metrics-grid">
          <div className="glass-card">
            <div className="metric-label">Mean Absolute Error (MAE)</div>
            <div className="metric-value">{status.mae}</div>
          </div>
          <div className="glass-card">
            <div className="metric-label">R² Operational Score</div>
            <div className="metric-value">{status.r2}</div>
          </div>
          <div className="glass-card">
            <div className="metric-label">System State Tracker</div>
            <div className={`status-badge ${statusClass}`}>
              {status.status_state}
            </div>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>{status.status_message}</p>
          </div>
        </div>

        {/* 🧾 Eco-Track Resource Compliance Ledger */}
        {showLedger && (
          <div className="glass-card" style={{ border: '1px solid rgba(96, 165, 250, 0.2)' }}>
            <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#60a5fa' }}>
              <Award size={22} /> EcoTrack Carbon & Resource Compliance Ledger
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div>
                <span className="metric-label">Grid Intensity</span>
                <h4 style={{ margin: '0.25rem 0', fontSize: '1.25rem' }}>{status.compliance.carbon_intensity} gCO2/kWh</h4>
                <span style={{ fontSize: '0.8rem', color: status.compliance.is_dirty ? '#ef4444' : '#10b981' }}>{status.compliance.grid_description}</span>
              </div>
              <div>
                <span className="metric-label">Water Cooling Loss</span>
                <h4 style={{ margin: '0.25rem 0', fontSize: '1.25rem' }}>{status.compliance.water_loss_liters} Liters</h4>
              </div>
              <div>
                <span className="metric-label">USD Tax Liability</span>
                <h4 style={{ margin: '0.25rem 0', fontSize: '1.25rem' }}>${status.compliance.tax_usd}</h4>
              </div>
              <div>
                <span className="metric-label">INR Compliance Tax</span>
                <h4 style={{ margin: '0.25rem 0', fontSize: '1.25rem' }}>₹{status.compliance.tax_inr}</h4>
              </div>
            </div>

            {status.compliance.is_dirty ? (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                <span style={{ color: '#ef4444', fontWeight: 'bold' }}>🛑 Eco-Gate Alert: </span>
                Grid is currently dirty. Retraining now is blocked to prevent carbon tax penalties. You can override to retrain anyway.
              </div>
            ) : (
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                <span style={{ color: '#10b981', fontWeight: 'bold' }}>🟢 Eco-Gate Clearance Approved: </span>
                Solar grid surplus is clean. It is safe to proceed with the training tournament.
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem' }}>
              {status.compliance.is_dirty ? (
                <button className="btn btn-danger" onClick={() => handleRetrain(true)}>Force Retrain anyway (Override)</button>
              ) : (
                <button className="btn btn-success" onClick={() => handleRetrain(false)}>Proceed to Retrain (Clean Run)</button>
              )}
            </div>
          </div>
        )}

        {/* 🏁 Model Tournament Results Card */}
        {retrainOutput && (
          <div className="glass-card" style={{ border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#10b981' }}>🏁 Model Tournament Execution Engine</h3>
            {retrainOutput.tournament_won ? (
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', color: '#10b981' }}>
                <strong>🏆 Tournament Battle Winner: Challenger Model!</strong> Swapping models and hot-deploying into the production registry.
              </div>
            ) : (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem', color: '#ef4444' }}>
                <strong>🛡️ Tournament Battle Winner: Champion Model!</strong> Challenger failed to beat active production baseline. Retaining champion model.
              </div>
            )}
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Model Variant</th>
                  <th>R² Score</th>
                  <th>MAE</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Champion Model (Active Production)</td>
                  <td>{retrainOutput.champion.r2}</td>
                  <td>{retrainOutput.champion.mae}</td>
                </tr>
                <tr>
                  <td>Challenger Model (Fresh Structural Run)</td>
                  <td>{retrainOutput.challenger.r2}</td>
                  <td>{retrainOutput.challenger.mae}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* 🗂️ Model Registry Database Rollback Section */}
        <div className="glass-card">
          <h3 style={{ margin: '0 0 1rem 0' }}>🗂️ Model Registry version control (Rollback Engine)</h3>
          <table className="custom-table">
            <thead>
              <tr>
                <th>Model Version</th>
                <th>Validation R²</th>
                <th>Validation MAE</th>
                <th>Training Timestamp</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {status.model_history.map((model, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 'bold' }}>{model.version}</td>
                  <td>{model.r2.toFixed(3)}</td>
                  <td>{model.mae.toFixed(2)}</td>
                  <td>{model.trained_at}</td>
                  <td>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem', width: 'auto' }}
                      onClick={() => handleRollback(model.version)}
                      disabled={status.active_version === model.version}
                    >
                      Rollback
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default App;
