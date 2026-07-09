# EcoTrack: Carbon-Aware MLOps Governance Middleware

### 🔗 Live Project Links
- **Frontend Dashboard (Live)**: [https://ecotrack-jzs1.onrender.com](https://ecotrack-jzs1.onrender.com)
- **Backend API (Live)**: [https://ecotrack-api-mqgg.onrender.com/status?hour=12](https://ecotrack-api-mqgg.onrender.com/status?hour=12)
- **Demo Video**: [YouTube Presentation Link](https://youtu.be/VIBvI9lP5Vs)

EcoTrack is a carbon-aware MLOps governance tower designed to mitigate the environmental impact of modern artificial intelligence pipelines. Rather than blindly triggering model retraining cycles as soon as data drift is detected, EcoTrack audits regional grid emissions, calculates cooling water loss, assesses compliance tax liabilities, and conducts validation tournament duels before promoting model weights.

---

## 🌟 Key Features

1. **The Eco-Gate Governance Layer**:
   - Audits regional grid hour carbon intensity (gCO2/kWh).
   - Computes compliance tax liabilities (in USD and INR) and resource overhead (water cooling liters) for every run.
   - Dynamically blocks training cycles during peak high-emission grid hours unless explicitly overridden.

2. **Inference Deviation Monitor**:
   - Live visual deviation tracking plotting actual targets against model predictions.
   - Includes a simulated **Inject 2026 Drift** event to showcase accuracy degradation and "DRIFT DETECTED" state warnings.

3. **Cumulative History Tournament Duel**:
   - Isolates the latest 20 crisis rows for continuous validation.
   - Compares the accuracy ($R^2$ score and MAE) of candidate Challengers against active production Champions.
   - Automatically hot-deploys and registers the Challenger only if it outperforms the active Champion.

4. **Double-Alignment Rollback Engine**:
   - Registry integrated with MongoDB (`model_registry`).
   - Rollback events hot-swap active model weights *and* truncate `dataset.csv` back to its versioned limit to heal metrics and graphs instantly.

---

## 🛠️ Technology Stack

- **Frontend**: React.js, Vite, Recharts, Lucide Icons, Vanilla CSS (Premium Glassmorphism).
- **Backend**: FastAPI, Uvicorn, Scikit-learn (DecisionTreeRegressor), Joblib, Pandas, NumPy.
- **Database & Registry**: MongoDB (Predictions logging & Model Registry versioning).
- **Containerization**: Docker, Docker Compose, Nginx.

---

## 📂 Project Structure

```
Ecotrack/
│
├── api.py                  # FastAPI Backend API Server (Port 8000)
├── dataset.csv             # Combined Air Quality Index (AQI) feature dataset
├── requirements.txt        # Backend dependencies
├── Dockerfile              # Root Dockerfile for Python backend
├── docker-compose.yml      # Orchestrates database, backend, and frontend
│
├── frontend/               # React Frontend Application (Port 5173)
│   ├── src/
│   │   ├── App.jsx         # Dashboard & Landing Page components
│   │   ├── index.css       # Premium Glassmorphism stylesheet
│   │   └── main.jsx        # App entry point
│   ├── Dockerfile          # Frontend Dockerfile (Multi-stage Node + Nginx build)
│   └── package.json
│
└── models/                 # Cached versioned champion pkl weights
```

---

## 🚀 How to Run Locally

### 1. Prerequisites
- MongoDB installed and running on `mongodb://localhost:27017/`
- Node.js (v18+)
- Python (3.10+)

### 2. Start Backend API
```bash
# Set environment variables and run FastAPI
$env:MONGO_URI="mongodb://localhost:27017/"
.\venv\Scripts\python api.py
```
Backend runs at `http://127.0.0.1:8000`.

### 3. Start Frontend Client
```bash
cd frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```
Frontend runs at `http://127.0.0.1:5173`.

---

## 🐳 How to Run with Docker Compose

Build and spin up the database, API, and Nginx frontend in containerized modes:
```bash
docker-compose up --build
```
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`
- MongoDB: `localhost:27017`

---

## 👥 Contributor Roles

- **Deepa Sahana (Data & ML Engine)**: Curated the AQI dataset, designed the baseline regressor pipeline, and built the drift noise generator.
- **Dhaarani (Backend & Database Architecture)**: Created the FastAPI endpoints, built the Eco-Gate calculations, integrated MongoDB, and implemented the double-alignment rollback logic.
- **Janani (Frontend UI/UX)**: Built the SPA interface using React, Recharts, floating background glow animations, and navigation controls.
