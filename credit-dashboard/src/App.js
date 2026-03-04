import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [formData, setFormData] = useState({
    income: '', loan_amount: '', credit_history_months: '', 
    debt_to_income_ratio: '', age: '', employment_length: '', home_ownership: '0'
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const response = await axios.post('http://127.0.0.1:5000/api/v1/predict_risk', formData);
      setResult(response.data);
    } catch (error) {
      console.error("API Error:", error);
      alert("Failed to connect to the backend.");
    }
    setLoading(false);
  };

  const isFormValid = Object.values(formData).every(val => val !== '');

  // Helper for the circular gauge
  const getStrokeColor = (score) => score > 60 ? '#ef4444' : score > 30 ? '#f59e0b' : '#10b981';

  return (
    <div className="dashboard">
      {/* LEFT SIDEBAR: Data Input */}
      <aside className="sidebar">
        <div className="brand">
          <h2>Risk<span className="text-blue">AI</span></h2>
          <p>Credit Analysis Engine</p>
        </div>
        
        <div className="form-group">
          <label>Annual Income ($)</label>
          <input name="income" type="number" onChange={handleChange} value={formData.income} />
        </div>
        <div className="form-group">
          <label>Loan Amount Requested ($)</label>
          <input name="loan_amount" type="number" onChange={handleChange} value={formData.loan_amount} />
        </div>
        <div className="form-group">
          <label>Credit History (Months)</label>
          <input name="credit_history_months" type="number" onChange={handleChange} value={formData.credit_history_months} />
        </div>
        <div className="form-group">
          <label>Debt-to-Income Ratio (e.g. 0.35)</label>
          <input name="debt_to_income_ratio" type="number" step="0.01" onChange={handleChange} value={formData.debt_to_income_ratio} />
        </div>
        <div className="form-grid">
          <div className="form-group">
            <label>Age</label>
            <input name="age" type="number" onChange={handleChange} value={formData.age} />
          </div>
          <div className="form-group">
            <label>Employment (Yrs)</label>
            <input name="employment_length" type="number" onChange={handleChange} value={formData.employment_length} />
          </div>
        </div>
        <div className="form-group">
          <label>Home Ownership</label>
          <select name="home_ownership" onChange={handleChange} value={formData.home_ownership}>
            <option value="0">Rent</option>
            <option value="1">Mortgage</option>
            <option value="2">Own Outright</option>
          </select>
        </div>

        <button className={`btn-primary ${!isFormValid || loading ? 'disabled' : ''}`} onClick={handleAnalyze} disabled={!isFormValid || loading}>
          {loading ? 'Running AI Engine...' : 'Run Analysis'}
        </button>
      </aside>

      {/* RIGHT MAIN CONTENT: Analysis Results */}
      <main className="main-content">
        {!result ? (
          <div className="empty-state">
            <h3>Ready for Analysis</h3>
            <p>Enter applicant details in the sidebar to generate a comprehensive risk profile, SHAP feature impact, and market comparison.</p>
          </div>
        ) : (
          <div className="results-container">
            
            {/* Top Row: Score & Averages */}
            <div className="top-widgets">
              <div className="card score-card">
                <h3>Default Risk Score</h3>
                <div className="gauge-container">
                  <svg viewBox="0 0 36 36" className="circular-chart">
                    <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <path className="circle" strokeDasharray={`${result.default_risk_percentage}, 100`} stroke={getStrokeColor(result.default_risk_percentage)} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <text x="18" y="20.35" className="percentage">{result.default_risk_percentage}%</text>
                  </svg>
                </div>
                <p className="score-subtitle">Probability of default within 24 months.</p>
              </div>

              <div className="card analysis-card">
                <h3>Market Comparison Analysis</h3>
                <p className="subtext">How this applicant compares to the dataset average.</p>
                [Image of credit score risk distribution chart]
                <div className="comparison-list">
                  <div className="comp-item">
                    <span>Income</span>
                    <strong>${Number(formData.income).toLocaleString()} vs <span className="avg">${Math.round(result.market_averages.income).toLocaleString()}</span></strong>
                  </div>
                  <div className="comp-item">
                    <span>DTI Ratio</span>
                    <strong>{formData.debt_to_income_ratio} vs <span className="avg">{result.market_averages.debt_to_income_ratio.toFixed(2)}</span></strong>
                  </div>
                  <div className="comp-item">
                    <span>Credit History</span>
                    <strong>{formData.credit_history_months} mo vs <span className="avg">{Math.round(result.market_averages.credit_history_months)} mo</span></strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Row: AI Reasoning */}
            <div className="card shap-card">
              <h3>AI Decision Reasoning (SHAP Values)</h3>
              <p className="subtext">Factors pushing the risk score higher (red) or lower (green).</p>
              [Image of a SHAP summary plot explaining machine learning model predictions]
              
              <div className="shap-bars">
                {Object.entries(result.feature_explanations)
                  .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a))
                  .map(([feature, impact]) => (
                  <div className="shap-row" key={feature}>
                    <div className="shap-label">
                      {feature.replace(/_/g, ' ')}
                      <span className={impact > 0 ? 'text-red' : 'text-green'}>
                        {impact > 0 ? ' ↑ Increases Risk' : ' ↓ Decreases Risk'}
                      </span>
                    </div>
                    <div className="bar-track">
                      <div 
                        className={`bar-fill ${impact > 0 ? 'bg-red' : 'bg-green'}`} 
                        style={{ width: `${Math.min(Math.abs(impact) * 35, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}

export default App;