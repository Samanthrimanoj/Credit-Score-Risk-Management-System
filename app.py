import pandas as pd
import xgboost as xgb
import shap
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})

# ---------------------------------------------------------
# 1. MODEL INITIALIZATION & DATA GENERATION -main2 branch
# ---------------------------------------------------------
def generate_synthetic_data(n_samples=1500):
    np.random.seed(42)
    df = pd.DataFrame({
        'income': np.random.randint(35000, 180000, n_samples),
        'loan_amount': np.random.randint(5000, 60000, n_samples),
        'credit_history_months': np.random.randint(12, 180, n_samples),
        'debt_to_income_ratio': np.random.uniform(0.1, 0.7, n_samples),
        'age': np.random.randint(22, 75, n_samples),
        'employment_length': np.random.randint(0, 30, n_samples),
        'home_ownership': np.random.choice([0, 1, 2], n_samples) # 0: Rent, 1: Mortgage, 2: Own
    })
    
    # Complex realistic target variable generation
    risk_factor = (
        (df['debt_to_income_ratio'] * 2.5) - 
        (df['credit_history_months'] / 150) + 
        (df['loan_amount'] / df['income']) -
        (df['employment_length'] / 40) -
        (df['home_ownership'] * 0.15)
    )
    
    # Top 25% highest risk factors default
    threshold = np.percentile(risk_factor, 75)
    y = (risk_factor > threshold).astype(int)
    
    return df, y

print("Generating data and training model...")
X_train, y_train = generate_synthetic_data()

model = xgb.XGBClassifier(n_estimators=150, max_depth=4, learning_rate=0.05, eval_metric='logloss')
model.fit(X_train, y_train)
explainer = shap.TreeExplainer(model)
market_averages = X_train.mean().to_dict() # Calculate dataset averages for frontend analysis

print("Model trained successfully!")

# ---------------------------------------------------------
# 2. API ENDPOINTS
# ---------------------------------------------------------
@app.route('/api/v1/predict_risk', methods=['POST', 'OPTIONS'])
def predict_risk():
    if request.method == 'OPTIONS':
        return jsonify({"status": "ok"}), 200

    try:
        data = request.json
        features_order = ['income', 'loan_amount', 'credit_history_months', 'debt_to_income_ratio', 'age', 'employment_length', 'home_ownership']
        
        # Parse inputs, defaulting to 0 if missing
        input_data = {feat: float(data.get(feat, 0)) for feat in features_order}
        input_df = pd.DataFrame([input_data])
        
        # Prediction
        probability = model.predict_proba(input_df)[0][1]
        risk_score = round(float(probability) * 100, 2)
        
        # SHAP Explanations
        shap_values = explainer.shap_values(input_df)
        impacts = shap_values[0].tolist()
        explanation_data = {feat: float(imp) for feat, imp in zip(features_order, impacts)}

        return jsonify({
            "status": "success",
            "default_risk_percentage": risk_score,
            "feature_explanations": explanation_data,
            "market_averages": market_averages
        })

    except Exception as e:
        print(f"Error: {e}") 
        return jsonify({"status": "error", "message": str(e)}), 400

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)