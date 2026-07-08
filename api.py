# api.py
"""EcoTrack API Engine.
FastAPI backend that manages datasets, trains ML models, runs the Champion vs. Challenger
tournament, calculates grid carbon/water compliance tax, and integrates with MongoDB.
"""

import os
import time
import datetime
import joblib
import pandas as pd
import numpy as np
from typing import Optional
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pymongo import MongoClient
from sklearn.tree import DecisionTreeRegressor
from sklearn.metrics import mean_absolute_error, r2_score

app = FastAPI(title="EcoTrack MLOps Core Engine")

# CORS Middleware to allow React Frontend (port 5173) to communicate
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------
# ---------- DATABASE & REGISTRY CONFIG -----------
# ---------------------------------------------------
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
client = MongoClient(MONGO_URI)
db = client["ecotrack_db"]
predictions_collection = db["predictions"]
registry_collection = db["model_registry"]

DATASET_PATH = "dataset.csv"
MODEL_PATH = "champion_model.pkl"

# Global in-memory Active Champion Model reference
active_champion = None
active_champion_version = "v1.0"
simulated_hour = 12

def generate_base_dataset(n=60, seed=42):
    """Generates clean historical baseline parameters mimicking CPCB schema."""
    rng = np.random.default_rng(seed)
    df = pd.DataFrame({
        "PM2.5": rng.integers(30, 80, size=n),
        "PM10":  rng.integers(60, 140, size=n),
        "NO2":   rng.integers(15, 50, size=n),
        "CO":    rng.uniform(0.4, 1.2, size=n),
        "SO2":   rng.integers(5, 25, size=n),
    })
    # Target function modeling AQI calculation
    df["AQI"] = (0.4 * df["PM2.5"] + 0.3 * df["PM10"] + 0.2 * df["NO2"] + 15 * df["CO"]).round(2)
    return df

def init_system():
    global active_champion, active_champion_version
    # 1. Setup dataset.csv
    if not os.path.exists(DATASET_PATH):
        df = generate_base_dataset()
        df.to_csv(DATASET_PATH, index=False)
    else:
        df = pd.read_csv(DATASET_PATH)

    # 2. Train and cache baseline Champion if not present
    X = df[["PM2.5", "PM10", "NO2", "CO", "SO2"]]
    y = df["AQI"]
    
    os.makedirs("models", exist_ok=True)
    baseline_filename = "models/champion_v1.0.pkl"
    
    if os.path.exists(baseline_filename):
        try:
            active_champion = joblib.load(baseline_filename)
        except Exception:
            active_champion = DecisionTreeRegressor(max_depth=5, random_state=42)
            active_champion.fit(X, y)
            joblib.dump(active_champion, baseline_filename)
    else:
        active_champion = DecisionTreeRegressor(max_depth=5, random_state=42)
        active_champion.fit(X, y)
        joblib.dump(active_champion, baseline_filename)
        
    joblib.dump(active_champion, MODEL_PATH)
        
    # Register in MongoDB if empty
    if registry_collection.count_documents({"version": "v1.0"}) == 0:
        registry_collection.insert_one({
            "version": "v1.0",
            "model_path": baseline_filename,
            "trained_at": datetime.datetime.now().isoformat(),
            "r2": float(r2_score(y, active_champion.predict(X))),
            "mae": float(mean_absolute_error(y, active_champion.predict(X))),
            "description": "Baseline historical Champion model",
            "dataset_rows": len(df)
        })

# Run startup initialization
init_system()

# ---------------------------------------------------
# ---------- GOVERNANCE CALCULATIONS ---------------
# ---------------------------------------------------
def calculate_compliance(hour: int, data_len: int):
    # Hour 18 to 22 represents peak grid time
    is_dirty = 18 <= hour <= 22
    carbon_intensity = 515 if is_dirty else 65
    grid_desc = "DIRTY (High Peak Coal/Gas Backup Grid Allocation)" if is_dirty else "CLEAN (Renewable Solar Surplus Abundance)"
    
    # Resource metrics (simulated 10 kWh baseline training profile)
    water_loss = 38.4 if is_dirty else 12.1
    carbon_tax_usd = ((10 * carbon_intensity) / 1000) * 0.15
    carbon_tax_inr = carbon_tax_usd * 83.3
    
    return {
        "hour": hour,
        "is_dirty": is_dirty,
        "carbon_intensity": carbon_intensity,
        "grid_description": grid_desc,
        "water_loss_liters": water_loss,
        "tax_usd": round(carbon_tax_usd, 4),
        "tax_inr": round(carbon_tax_inr, 2)
    }

# ---------------------------------------------------
# ---------- API ENDPOINTS -------------------------
# ---------------------------------------------------

@app.get("/status")
def get_status(hour: int = 12):
    global simulated_hour
    simulated_hour = hour
    
    # Read current dataset
    df = pd.read_csv(DATASET_PATH)
    X = df[["PM2.5", "PM10", "NO2", "CO", "SO2"]]
    y = df["AQI"]
    
    # Current active champion predictions
    preds = active_champion.predict(X)
    mae = mean_absolute_error(y, preds)
    r2 = r2_score(y, preds)
    
    # Determine system status state
    if r2 > 0.85:
        status_state = "HEALTHY"
        status_message = "Statistical variances are behaving cleanly within historical thresholds."
    elif r2 > 0.40:
        status_state = "DEGRADED"
        status_message = "Minor prediction discrepancies captured. Intervention recommended."
    else:
        status_state = "DRIFT DETECTED"
        status_message = "Feature distributions severely mismatched. Retraining required."

    # Compute compliance ledger
    compliance = calculate_compliance(hour, len(df))
    
    # Retrieve past model history from MongoDB Registry
    history = list(registry_collection.find({}, {"_id": 0}))

    # Payload for time-series charts (limit to last 50 for visualization efficiency)
    chart_data = []
    for idx, row in df.tail(50).iterrows():
        chart_data.append({
            "index": idx,
            "actual": float(row["AQI"]),
            "predicted": float(preds[idx])
        })

    return {
        "mae": round(mae, 2),
        "r2": round(r2, 3),
        "status_state": status_state,
        "status_message": status_message,
        "compliance": compliance,
        "active_version": active_champion_version,
        "model_history": history,
        "chart_data": chart_data,
        "dataset_rows": len(df)
    }

@app.post("/inject")
def inject_drift():
    # Load current dataset
    df = pd.read_csv(DATASET_PATH)
    
    # Generate 100 rows of skewed 2026 crisis data
    rng = np.random.default_rng()
    anomalous_rows = 100
    drift_data = pd.DataFrame({
        "PM2.5": rng.integers(340, 490, size=anomalous_rows),
        "PM10":  rng.integers(400, 580, size=anomalous_rows),
        "NO2":   rng.integers(110, 180, size=anomalous_rows),
        "CO":    rng.uniform(6.5, 11.0, size=anomalous_rows),
        "SO2":   rng.integers(50, 90, size=anomalous_rows),
    })
    drift_data["AQI"] = (0.4 * drift_data["PM2.5"] + 0.3 * drift_data["PM10"] + 0.2 * drift_data["NO2"] + 15 * drift_data["CO"]).round(2)
    
    # Append to local CSV
    df_new = pd.concat([df, drift_data], ignore_index=True)
    df_new.to_csv(DATASET_PATH, index=False)
    
    # Store in MongoDB predictions collection for audit logs
    records = drift_data.to_dict(orient="records")
    for r in records:
        r["logged_at"] = datetime.datetime.now().isoformat()
    predictions_collection.insert_many(records)
    
    return {
        "status": "success",
        "message": "Successfully injected 100 rows of 2026 skewed crisis data into dataset.csv and MongoDB predictions log."
    }

@app.post("/retrain")
def retrain_model(payload: dict = Body(...)):
    global active_champion, active_champion_version
    override = payload.get("override", False)
    hour = payload.get("hour", simulated_hour)
    
    # 1. Eco-Gate verification
    compliance = calculate_compliance(hour, 100)
    if compliance["is_dirty"] and not override:
        return {
            "status": "blocked",
            "message": "Retraining BLOCKED by Eco-Gate: Grid carbon intensity is high and ambient factors are unfavorable."
        }

    # 2. Load entire combined database history
    df = pd.read_csv(DATASET_PATH)
    if len(df) <= 20:
        raise HTTPException(status_code=400, detail="Insufficient records in dataset to train Challenger.")

    # 3. Split: Evaluate both models on the isolated 20 crisis validation rows
    val_slice = df.tail(20)
    train_slice = df.iloc[:-20]

    features = ["PM2.5", "PM10", "NO2", "CO", "SO2"]
    target = "AQI"

    X_train, y_train = train_slice[features], train_slice[target]
    X_val, y_val = val_slice[features], val_slice[target]

    # 4. Train Challenger
    challenger = DecisionTreeRegressor(max_depth=5, random_state=42)
    challenger.fit(X_train, y_train)

    # 5. Evaluate tournament
    champ_r2 = r2_score(y_val, active_champion.predict(X_val))
    chal_r2 = r2_score(y_val, challenger.predict(X_val))

    champ_mae = mean_absolute_error(y_val, active_champion.predict(X_val))
    chal_mae = mean_absolute_error(y_val, challenger.predict(X_val))

    tournament_won = bool(chal_r2 > champ_r2)

    if tournament_won:
        # Register new model in MongoDB Registry
        version_num = f"v1.{registry_collection.count_documents({}) + 1}"
        model_filename = f"models/champion_{version_num}.pkl"
        os.makedirs("models", exist_ok=True)
        joblib.dump(challenger, model_filename)
        
        # Save active reference link
        joblib.dump(challenger, MODEL_PATH)
        active_champion = challenger
        active_champion_version = version_num
        
        registry_collection.insert_one({
            "version": version_num,
            "model_path": model_filename,
            "trained_at": datetime.datetime.now().isoformat(),
            "r2": float(chal_r2),
            "mae": float(chal_mae),
            "description": f"Challenger model trained on pooled data ({len(df)} rows)",
            "dataset_rows": len(df)
        })

    return {
        "status": "success",
        "tournament_won": tournament_won,
        "champion": {
            "version": active_champion_version,
            "r2": round(champ_r2, 4),
            "mae": round(champ_mae, 2)
        },
        "challenger": {
            "r2": round(chal_r2, 4),
            "mae": round(chal_mae, 2)
        }
    }

@app.post("/rollback")
def rollback_model(payload: dict = Body(...)):
    global active_champion, active_champion_version
    target_version = payload.get("version")
    
    model_record = registry_collection.find_one({"version": target_version})
    if not model_record:
        raise HTTPException(status_code=404, detail=f"Model version {target_version} not found in registry.")

    model_file_path = model_record["model_path"]
    if not os.path.exists(model_file_path):
        # Fallback to base model path if version path doesn't exist
        model_file_path = MODEL_PATH

    try:
        active_champion = joblib.load(model_file_path)
        active_champion_version = target_version
        
        # Truncate dataset to version's row count
        dataset_rows = model_record.get("dataset_rows", 60)
        if os.path.exists(DATASET_PATH):
            df = pd.read_csv(DATASET_PATH)
            if len(df) > dataset_rows:
                df_truncated = df.iloc[:dataset_rows]
                df_truncated.to_csv(DATASET_PATH, index=False)
                
        return {
            "status": "success",
            "message": f"Successfully rolled back active production weights and reverted data state to version {target_version}."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load rollback model weights file: {str(e)}")

@app.post("/reset")
def reset_system():
    global active_champion, active_champion_version
    
    # 1. Reset dataset.csv to original 60 rows
    df_baseline = generate_base_dataset()
    df_baseline.to_csv(DATASET_PATH, index=False)
    
    # 2. Reset MongoDB collections
    predictions_collection.delete_many({})
    registry_collection.delete_many({})
    
    # 3. Reset to baseline version
    active_champion = DecisionTreeRegressor(max_depth=5, random_state=42)
    X = df_baseline[["PM2.5", "PM10", "NO2", "CO", "SO2"]]
    y = df_baseline["AQI"]
    active_champion.fit(X, y)
    
    os.makedirs("models", exist_ok=True)
    baseline_filename = "models/champion_v1.0.pkl"
    joblib.dump(active_champion, baseline_filename)
    joblib.dump(active_champion, MODEL_PATH)
    active_champion_version = "v1.0"
    
    registry_collection.insert_one({
        "version": "v1.0",
        "model_path": baseline_filename,
        "trained_at": datetime.datetime.now().isoformat(),
        "r2": float(r2_score(y, active_champion.predict(X))),
        "mae": float(mean_absolute_error(y, active_champion.predict(X))),
        "description": "Baseline historical Champion model",
        "dataset_rows": len(df_baseline)
    })
    
    return {
        "status": "success",
        "message": "EcoTrack database, model registry, and dataset.csv fully reset to baseline state."
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
