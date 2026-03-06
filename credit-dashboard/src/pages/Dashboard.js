import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import './Dashboard.css';

export default function Dashboard() {
    const { user, signOut } = useAuth();
    const [formData, setFormData] = useState({
        income: '', loan_amount: '', credit_history_months: '',
        debt_to_income_ratio: '', age: '', employment_length: '', home_ownership: '0'
    });
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState([]);
    const [showHistory, setShowHistory] = useState(false);

    const fetchHistory = useCallback(async () => {
        if (!user) return;
        const { data } = await supabase
            .from('predictions')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10);
        if (data) setHistory(data);
    }, [user]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const savePrediction = async (riskScore) => {
        if (!user) return;
        await supabase.from('predictions').insert({
            user_id: user.id,
            income: Number(formData.income),
            loan_amount: Number(formData.loan_amount),
            credit_history_months: Number(formData.credit_history_months),
            debt_to_income_ratio: Number(formData.debt_to_income_ratio),
            age: Number(formData.age),
            employment_length: Number(formData.employment_length),
            home_ownership: Number(formData.home_ownership),
            risk_score: riskScore
        });
        fetchHistory();
    };

    const handleAnalyze = async () => {
        setLoading(true);
        try {
            const response = await axios.post('http://127.0.0.1:5000/api/v1/predict_risk', formData);
            setResult(response.data);
            await savePrediction(response.data.default_risk_percentage);
        } catch (error) {
            console.error("API Error:", error);
            alert("Failed to connect to the backend. Make sure the Flask server is running.");
        }
        setLoading(false);
    };

    const handleLogout = async () => {
        await signOut();
    };

    const isFormValid = Object.values(formData).every(val => val !== '');

    const getStrokeColor = (score) => score > 60 ? '#ef4444' : score > 30 ? '#f59e0b' : '#10b981';
    const getRiskLabel = (score) => score > 60 ? 'High Risk' : score > 30 ? 'Medium Risk' : 'Low Risk';
    const getRiskClass = (score) => score > 60 ? 'risk-high' : score > 30 ? 'risk-medium' : 'risk-low';

    const homeOwnershipLabels = { '0': 'Rent', '1': 'Mortgage', '2': 'Own' };

    return (
        <div className="dash-layout">
            {/* == SIDEBAR == */}
            <aside className="dash-sidebar">
                <div className="sidebar-header">
                    <div className="sidebar-brand">
                        <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
                            <rect width="40" height="40" rx="12" fill="url(#sideGrad)" />
                            <path d="M12 20L18 26L28 14" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                            <defs>
                                <linearGradient id="sideGrad" x1="0" y1="0" x2="40" y2="40">
                                    <stop stopColor="#a78bfa" />
                                    <stop offset="1" stopColor="#6366f1" />
                                </linearGradient>
                            </defs>
                        </svg>
                        <div>
                            <h2>Risk<span className="accent">AI</span></h2>
                            <span className="sidebar-subtitle">Credit Analysis Engine</span>
                        </div>
                    </div>
                </div>

                {/* User Profile */}
                <div className="user-profile">
                    <div className="avatar">{user?.email?.charAt(0).toUpperCase()}</div>
                    <div className="user-info">
                        <span className="user-email">{user?.email}</span>
                        <button className="logout-btn" onClick={handleLogout}>Sign Out</button>
                    </div>
                </div>

                <div className="sidebar-divider" />

                {/* Form inputs */}
                <div className="form-section">
                    <h3 className="section-title">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20V10M6 20V4M18 20v-6" /></svg>
                        Applicant Data
                    </h3>

                    <div className="field">
                        <label>Annual Income ($)</label>
                        <input name="income" type="number" onChange={handleChange} value={formData.income} placeholder="e.g. 75000" />
                    </div>
                    <div className="field">
                        <label>Loan Amount ($)</label>
                        <input name="loan_amount" type="number" onChange={handleChange} value={formData.loan_amount} placeholder="e.g. 25000" />
                    </div>
                    <div className="field">
                        <label>Credit History (Months)</label>
                        <input name="credit_history_months" type="number" onChange={handleChange} value={formData.credit_history_months} placeholder="e.g. 60" />
                    </div>
                    <div className="field">
                        <label>Debt-to-Income Ratio</label>
                        <input name="debt_to_income_ratio" type="number" step="0.01" onChange={handleChange} value={formData.debt_to_income_ratio} placeholder="e.g. 0.35" />
                    </div>
                    <div className="field-row">
                        <div className="field">
                            <label>Age</label>
                            <input name="age" type="number" onChange={handleChange} value={formData.age} placeholder="30" />
                        </div>
                        <div className="field">
                            <label>Employ. (Yrs)</label>
                            <input name="employment_length" type="number" onChange={handleChange} value={formData.employment_length} placeholder="5" />
                        </div>
                    </div>
                    <div className="field">
                        <label>Home Ownership</label>
                        <select name="home_ownership" onChange={handleChange} value={formData.home_ownership}>
                            <option value="0">Rent</option>
                            <option value="1">Mortgage</option>
                            <option value="2">Own Outright</option>
                        </select>
                    </div>
                </div>

                <button
                    className={`analyze-btn ${!isFormValid || loading ? 'disabled' : ''}`}
                    onClick={handleAnalyze}
                    disabled={!isFormValid || loading}
                >
                    {loading ? (
                        <><span className="btn-spinner" /> Analyzing...</>
                    ) : (
                        <>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
                            Run Analysis
                        </>
                    )}
                </button>

                {/* History Toggle */}
                <button className="history-toggle" onClick={() => setShowHistory(!showHistory)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                    {showHistory ? 'Hide' : 'Show'} History ({history.length})
                </button>

                {showHistory && history.length > 0 && (
                    <div className="history-list">
                        {history.map((item, i) => (
                            <div className="history-item" key={item.id || i}>
                                <div className="history-score">
                                    <span className={`dot ${getRiskClass(item.risk_score)}`} />
                                    {item.risk_score}%
                                </div>
                                <div className="history-details">
                                    <span>${Number(item.income).toLocaleString()} · ${Number(item.loan_amount).toLocaleString()}</span>
                                    <span className="history-date">{new Date(item.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </aside>

            {/* == MAIN CONTENT == */}
            <main className="dash-main">
                {!result ? (
                    <div className="empty-state">
                        <div className="empty-icon">
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                            </svg>
                        </div>
                        <h3>Ready for Analysis</h3>
                        <p>Enter applicant details in the sidebar and click <strong>Run Analysis</strong> to generate a comprehensive AI-powered risk profile.</p>
                        <div className="empty-features">
                            <div className="feature-chip">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
                                SHAP Explanations
                            </div>
                            <div className="feature-chip">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20V10M6 20V4M18 20v-6" /></svg>
                                Market Comparison
                            </div>
                            <div className="feature-chip">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                                Prediction History
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="results-grid">
                        {/* Risk Score Card */}
                        <div className="card score-card">
                            <div className="card-header">
                                <h3>Default Risk Score</h3>
                                <span className={`risk-badge ${getRiskClass(result.default_risk_percentage)}`}>
                                    {getRiskLabel(result.default_risk_percentage)}
                                </span>
                            </div>
                            <div className="gauge-wrapper">
                                <svg viewBox="0 0 36 36" className="circular-gauge">
                                    <path className="gauge-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                    <path
                                        className="gauge-fill"
                                        strokeDasharray={`${result.default_risk_percentage}, 100`}
                                        stroke={getStrokeColor(result.default_risk_percentage)}
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    />
                                    <text x="18" y="18.5" className="gauge-text">{result.default_risk_percentage}%</text>
                                    <text x="18" y="23" className="gauge-sub">risk score</text>
                                </svg>
                            </div>
                            <p className="score-desc">Probability of default within 24 months</p>
                        </div>

                        {/* Applicant Summary Card */}
                        <div className="card summary-card">
                            <div className="card-header">
                                <h3>Applicant Summary</h3>
                            </div>
                            <div className="summary-grid">
                                <div className="summary-item">
                                    <span className="sum-label">Income</span>
                                    <span className="sum-value">${Number(formData.income).toLocaleString()}</span>
                                </div>
                                <div className="summary-item">
                                    <span className="sum-label">Loan</span>
                                    <span className="sum-value">${Number(formData.loan_amount).toLocaleString()}</span>
                                </div>
                                <div className="summary-item">
                                    <span className="sum-label">DTI Ratio</span>
                                    <span className="sum-value">{formData.debt_to_income_ratio}</span>
                                </div>
                                <div className="summary-item">
                                    <span className="sum-label">Credit Hist.</span>
                                    <span className="sum-value">{formData.credit_history_months} mo</span>
                                </div>
                                <div className="summary-item">
                                    <span className="sum-label">Age</span>
                                    <span className="sum-value">{formData.age} yrs</span>
                                </div>
                                <div className="summary-item">
                                    <span className="sum-label">Employment</span>
                                    <span className="sum-value">{formData.employment_length} yrs</span>
                                </div>
                                <div className="summary-item span-2">
                                    <span className="sum-label">Ownership</span>
                                    <span className="sum-value">{homeOwnershipLabels[formData.home_ownership]}</span>
                                </div>
                            </div>
                        </div>

                        {/* Market Comparison Card */}
                        <div className="card compare-card">
                            <div className="card-header">
                                <h3>Market Comparison</h3>
                                <span className="card-badge">vs Dataset Avg</span>
                            </div>
                            <div className="compare-list">
                                {[
                                    { label: 'Income', val: `$${Number(formData.income).toLocaleString()}`, avg: `$${Math.round(result.market_averages.income).toLocaleString()}` },
                                    { label: 'DTI Ratio', val: formData.debt_to_income_ratio, avg: result.market_averages.debt_to_income_ratio.toFixed(2) },
                                    { label: 'Credit History', val: `${formData.credit_history_months} mo`, avg: `${Math.round(result.market_averages.credit_history_months)} mo` },
                                    { label: 'Loan Amount', val: `$${Number(formData.loan_amount).toLocaleString()}`, avg: `$${Math.round(result.market_averages.loan_amount).toLocaleString()}` },
                                ].map((c, i) => (
                                    <div className="compare-row" key={i}>
                                        <span className="compare-label">{c.label}</span>
                                        <div className="compare-vals">
                                            <span className="compare-yours">{c.val}</span>
                                            <span className="compare-divider">vs</span>
                                            <span className="compare-avg">{c.avg}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* SHAP Explanation Card */}
                        <div className="card shap-card">
                            <div className="card-header">
                                <h3>AI Decision Reasoning</h3>
                                <span className="card-badge">SHAP Values</span>
                            </div>
                            <p className="shap-desc">How each feature influenced the AI model's risk prediction.</p>
                            <div className="shap-bars">
                                {Object.entries(result.feature_explanations)
                                    .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a))
                                    .map(([feature, impact]) => (
                                        <div className="shap-row" key={feature}>
                                            <div className="shap-info">
                                                <span className="shap-feature">{feature.replace(/_/g, ' ')}</span>
                                                <span className={`shap-direction ${impact > 0 ? 'increases' : 'decreases'}`}>
                                                    {impact > 0 ? '↑ Increases Risk' : '↓ Decreases Risk'}
                                                </span>
                                            </div>
                                            <div className="shap-track">
                                                <div
                                                    className={`shap-fill ${impact > 0 ? 'fill-red' : 'fill-green'}`}
                                                    style={{ width: `${Math.min(Math.abs(impact) * 35, 100)}%` }}
                                                />
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
