# 🧠 MindPulse — Student Mental Health Score Predictor

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Render-0f766e?style=for-the-badge&logo=render&logoColor=white)](https://mindpulse-mkvi.onrender.com/)
[![Python](https://img.shields.io/badge/Python-3.12.4-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![scikit-learn](https://img.shields.io/badge/scikit--learn-1.6.1-F7931E?style=for-the-badge&logo=scikitlearn&logoColor=white)](https://scikit-learn.org/)

An end-to-end ML web app that predicts a student's **mental well-being score (0–10)** from their demographic profile, digital habits, daily routine, and stress level.

- **Model:** scikit-learn regression pipeline
- **Backend:** FastAPI
- **Frontend:** responsive HTML/CSS/JavaScript dashboard
- **Hosting:** frontend and ML API run from a single web service

🔗 **Live App:** https://mindpulse-mkvi.onrender.com/
📘 **API Docs (Swagger UI):** https://mindpulse-mkvi.onrender.com/docs

> ⏳ **Render free tier:** after 15+ minutes of inactivity, the first load can take 30–50 seconds while the server wakes up. Later predictions are near-instant.

---

## ✨ Features

- **Real-time predictions:** score from `0.00` to `10.00` using a Random Forest Regression pipeline (R² = 0.89)
- **Interactive controls:** synced sliders for screen time, study, physical activity, and sleep, plus a live 24-hour activity sanity meter
- **One-click presets:** *Balanced*, *Exam Crunch*, *Heavy Scroller*
- **Visual score gauge:** animated SVG radial gauge, color-coded into four tiers (*Thriving*, *Balanced*, *Moderate Strain*, *High Strain*)
- **Habit signals:** up to 3 actionable takeaways based on sleep, screen usage, phone unlocks, exercise, and stress
- **Validated REST API:** strict Pydantic request/response schemas with OpenAPI docs

---

## 🛠 Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **ML & EDA** | Python 3.12.4, scikit-learn 1.6.1, pandas, NumPy, joblib, Matplotlib, Seaborn |
| **Backend & API** | FastAPI, Uvicorn, Pydantic v2 |
| **Frontend** | HTML5, CSS3 (responsive grid, SVG gauge), Vanilla JS (`fetch` API) |
| **Deployment** | Render (single Python web service serving API + static UI) |

---

## ⚙️ How It Works

```text
[ Browser UI (HTML/CSS/JS) ]
       |
       | 1. User adjusts profile, digital habits, routine & stress
       | 2. POST /predict (JSON payload)
       v
[ FastAPI Server (main.py) ]
       |
       | 3. Pydantic validates input ranges & categories
       | 4. Maps Country -> Grouped_Country (Top 10 or "Other")
       | 5. Builds 12-feature pandas DataFrame
       v
[ Serialized ML Pipeline (mental_health_model.pkl) ]
       |
       | 6. ColumnTransformer (log1p, StandardScaler, OrdinalEncoder, OneHotEncoder)
       | 7. RandomForestRegressor predicts Mental Health Score
       v
[ FastAPI Response ]
       |
       | 8. Clamps score to [0, 10], assigns category & generates habit insights
       | 9. Returns JSON -> Browser animates gauge & displays takeaways
```

---

## 📊 ML Pipeline & Performance

All EDA, preprocessing, training, and evaluation are documented in `MENTAL_HEALTH_PREDICTOR_CODE.ipynb`.

### 1. Dataset (`data.csv`)

- **Raw size:** 5,000 student records, 13 columns (12 input features + target `Mental_Health_Score`), 0 missing values
- **Cleaning:**
  - Dropped 2 duplicate rows → **4,998 rows** for training/testing
  - Clipped negative `Physical_Activity_Hours` values (raw min `-0.4`) to `0.0`
- **Feature summary (post-cleaning):**

| Feature | Range | Mean |
| :--- | :---: | :---: |
| Age | 18–24 yrs | 20.82 |
| Avg Daily Usage Hours | 1.0–8.8 hrs | 5.08 |
| Daily Unlocks | 62–273 / day | 171.46 |
| Study Hours | 0.3–8.3 hrs | 3.01 |
| Physical Activity Hours | 0.0–4.1 hrs | 1.75 |
| Sleep Hours Per Night | 3.6–9.9 hrs | 6.63 |
| **Target: Mental Health Score** | 3.6–9.4 | 6.23 (std 1.28) |

### 2. Feature Engineering & Preprocessing

- **Country grouping:** 111 unique countries reduced to `Grouped_Country` to avoid sparsity. Top 10 are kept (`Other`, `India`, `USA`, `Canada`, `Australia`, `UK`, `Germany`, `Mexico`, `Turkey`, `France`) and the rest become `Other`.
- **Train/test split:** 80% / 20% (`random_state=42`)
- **Unified `ColumnTransformer`:**

| Feature Group | Columns | Transformation |
| :--- | :--- | :--- |
| Skewed numerical | `Study_Hours`, `Age`, `Sleep_Hours_Per_Night` | `FunctionTransformer(np.log1p)` → `StandardScaler()` |
| Standard numerical | `Avg_Daily_Usage_Hours`, `Daily_Unlocks`, `Physical_Activity_Hours` | `StandardScaler()` |
| Ordinal categorical | `Stress_Level` | `OrdinalEncoder` (order: `Low`, `Medium`, `High`, `Very High`) |
| Nominal categorical | `Gender`, `Academic_Level`, `Most_Used_Platform`, `Purpose_Of_Use`, `Grouped_Country` | `OneHotEncoder(handle_unknown="ignore")` |

### 3. Model Comparison

Three setups were benchmarked on the holdout set, with tuning via 5-fold `RandomizedSearchCV` (15 iterations).

| Model | Test R² | Train R² | MAE | RMSE |
| :--- | :---: | :---: | :---: | :---: |
| Linear Regression | 0.7418 | 0.7224 | 0.5346 | 0.6789 |
| **Random Forest (Default)** ✅ | **0.8899** | 0.9828 | **0.3281** | **0.4433** |
| Random Forest (Tuned) | 0.8758 | 0.9564 | 0.3533 | 0.4709 |

- **Tuned params:** `n_estimators=300`, `max_depth=15`, `min_samples_split=5`, `min_samples_leaf=2`
- **Deployed model:** Default Random Forest pipeline, saved as `mental_health_model.pkl` via `joblib`. It generalized best on unseen data (**R² = 0.8899**, **MAE = 0.33** on a 10-point scale).

### 4. Score Tiers

| Category | Score Range |
| :--- | :---: |
| 🟢 **Thriving** | ≥ 7.5 |
| 🔵 **Balanced** | 6.0 – < 7.5 |
| 🟠 **Moderate Strain** | 4.5 – < 6.0 |
| 🔴 **High Strain** | < 4.5 |

---

## 🚀 How to Use the Website

1. Open **https://mindpulse-mkvi.onrender.com/**
2. **Quick test:** click a preset (*Balanced*, *Exam Crunch*, or *Heavy Scroller*) to auto-fill habits and run a prediction.
3. **Custom profile:**
   - **01 Student Profile:** age, gender, academic level, country
   - **02 Digital Habits:** most used platform, primary purpose, daily screen time, daily unlocks
   - **03 Routine & Stress:** sliders for study, physical activity, and sleep (watch the 24-hour meter), then pick a stress level
4. Click **Predict Mental Health Score** to see your score, category, and habit signals.

---

## 📁 Project Structure

```text
MindPulse/
├── main.py                             # FastAPI backend (serves API + static frontend)
├── mental_health_model.pkl             # Serialized scikit-learn preprocessing + RF pipeline
├── requirements.txt                    # Python dependencies (pins scikit-learn==1.6.1)
├── .python-version                     # Pins Python 3.12.4 for pre-built Render wheels
├── data.csv                            # Dataset (5,000 student records)
├── MENTAL_HEALTH_PREDICTOR_CODE.ipynb  # EDA, feature engineering & model training
├── .gitignore                          # Git ignore rules
├── README.md                           # Project documentation
└── static/
    ├── index.html                      # Frontend layout & form controls
    ├── style.css                       # Responsive UI styling & gauge transitions
    └── script.js                       # Slider sync, presets, validation & API integration
```

---

## 💻 Running Locally

**Prerequisites:** Python 3.12.4 (or any 3.10–3.13 compatible with `scikit-learn==1.6.1` binary wheels), `pip`, and `git`.

1. **Clone the repo**
   ```bash
   git clone https://github.com/Harsh-Raj-Jordan/MindPulse.git
   cd MindPulse
   ```

2. **Create & activate a virtual environment (recommended)**
   ```bash
   # Windows (PowerShell)
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1

   # macOS / Linux
   python3 -m venv .venv
   source .venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Start the server**
   ```bash
   uvicorn main:app --reload
   ```

5. **Open in browser**
   - Web UI: `http://127.0.0.1:8000`
   - Swagger Docs: `http://127.0.0.1:8000/docs`
   - Health Check: `http://127.0.0.1:8000/health`

---

## 🔌 API Reference

### `GET /health`

Returns service status.

```json
{
  "status": "ok"
}
```

### `POST /predict`

Runs inference on a student profile and returns the score, category, summary, and habit insights.

**Request (`application/json`):**

```json
{
  "age": 21,
  "gender": "Male",
  "country": "India",
  "academic_level": "Undergraduate",
  "most_used_platform": "YouTube",
  "purpose_of_use": "Education",
  "avg_daily_usage_hours": 4.0,
  "daily_unlocks": 31,
  "study_hours": 4.5,
  "physical_activity_hours": 1.5,
  "sleep_hours_per_night": 7.2,
  "stress_level": "Medium"
}
```

**Response (`200 OK`):**

```json
{
  "predicted_mental_health_score": 7.51,
  "category": "Thriving",
  "summary": "Your daily routine shows strong balance between rest, focus, and screen habits.",
  "insights": [
    "Digital usage stays within a manageable daily range.",
    "Regular physical activity is helping buffer daily academic pressure."
  ]
}
```

---

## ☁️ Deployment on Render

Deployed as a **single Render Web Service**:

- **Runtime:** Python 3 (`PYTHON_VERSION=3.12.4`, matching `.python-version`)
- **Build command:** `pip install -r requirements.txt`
- **Start command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`

Pinning `PYTHON_VERSION=3.12.4` and `scikit-learn==1.6.1` ensures fast installs via pre-built `cp312` wheels and exact compatibility when unpickling `mental_health_model.pkl`.

---

## ⚠️ Disclaimer

MindPulse is for **educational and exploratory ML purposes only**. Predictions reflect statistical patterns in survey data and must **not** be treated as medical, psychological, or clinical advice.