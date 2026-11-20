# MindPulse — Student Mental Health Score Predictor

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Render-0f766e?style=for-the-badge&logo=render&logoColor=white)](https://mindpulse-mkvi.onrender.com/)
[![Python](https://img.shields.io/badge/Python-3.12.4-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![scikit-learn](https://img.shields.io/badge/scikit--learn-1.6.1-F7931E?style=for-the-badge&logo=scikitlearn&logoColor=white)](https://scikit-learn.org/)

**MindPulse** is an end-to-end machine learning web application that predicts a student's mental well-being score (on a scale of `0` to `10`) based on their demographic profile, digital habits, daily routine, and stress level. Built with a **scikit-learn** regression pipeline served through **FastAPI** and a responsive **HTML/CSS/JavaScript** dashboard, both the frontend and ML inference API run seamlessly from a single web service.

**Live Application:** [https://mindpulse-mkvi.onrender.com/](https://mindpulse-mkvi.onrender.com/)  
**Interactive API Docs (Swagger UI):** [https://mindpulse-mkvi.onrender.com/docs](https://mindpulse-mkvi.onrender.com/docs)

> **Note on Render Free Tier:** If the application has been inactive for 15+ minutes, the initial page load may take 30 to 50 seconds while the server wakes up. Subsequent predictions respond almost instantaneously.

---

## Key Features

* **Real-Time ML Predictions:** Estimates a student's mental health score (`0.00` to `10.00`) using a trained Random Forest Regression pipeline (`$R^2 = 0.89$`).
* **Interactive Lifestyle Controls:** Synced range sliders for screen time, study hours, physical activity, and sleep, alongside a live 24-hour activity sanity meter.
* **One-Click Sample Presets:** Quickly test the model with three built-in student personas: **Balanced**, **Exam Crunch**, and **Heavy Scroller**.
* **Visual Score Gauge & Status Categories:** Animated SVG radial gauge that dynamically color-codes results into four tiers (**Thriving**, **Balanced**, **Moderate Strain**, **High Strain**).
* **Personalized Habit Signals:** Automatically highlights up to three actionable takeaways based on sleep duration, screen usage, phone unlocks, exercise, and reported stress.
* **Validated REST API:** Strict Pydantic request/response schemas with built-in OpenAPI documentation.

---

## Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Machine Learning & EDA** | Python 3.12.4, scikit-learn `1.6.1`, pandas, NumPy, joblib, Matplotlib, Seaborn |
| **Backend & API** | FastAPI, Uvicorn, Pydantic v2 |
| **Frontend** | HTML5, CSS3 (Responsive Grid, SVG Gauge), Vanilla JavaScript (`fetch` API) |
| **Deployment** | Render (Single Python Web Service serving both API and static UI assets) |

---

## How It Works

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

## Machine Learning Pipeline & Model Performance

All exploratory data analysis, preprocessing, model training, and evaluation steps are documented in `MENTAL_HEALTH_PREDICTOR_CODE.ipynb`.

### 1. Dataset Overview (`data.csv`)
* **Raw Size:** 5,000 student records across 13 columns (12 input features + 1 continuous target: `Mental_Health_Score`), with **0 missing values**.
* **Data Cleaning:**
  * Dropped **2 duplicate rows** (final training/testing dataset: **4,998 rows**).
  * Clipped unrealistic negative values in `Physical_Activity_Hours` (minimum raw value was `-0.4`) to `0.0`.
* **Feature Summary (Post-Cleaning):**
  * **Age:** 18 to 24 years (mean `20.82`)
  * **Avg Daily Usage Hours:** 1.0 to 8.8 hrs (mean `5.08`)
  * **Daily Unlocks:** 62 to 273 unlocks/day (mean `171.46`)
  * **Study Hours:** 0.3 to 8.3 hrs (mean `3.01`)
  * **Physical Activity Hours:** 0.0 to 4.1 hrs (mean `1.75`)
  * **Sleep Hours Per Night:** 3.6 to 9.9 hrs (mean `6.63`)
  * **Target (`Mental_Health_Score`):** 3.6 to 9.4 (mean `6.23`, std `1.28`)

### 2. Feature Engineering & Preprocessing
* **Country Grouping:** The original `Country` column contained 111 unique countries. To prevent high-cardinality sparsity during encoding, countries were mapped into `Grouped_Country` retaining the top 10 values (`Other`, `India`, `USA`, `Canada`, `Australia`, `UK`, `Germany`, `Mexico`, `Turkey`, `France`) and grouping all remaining countries into `Other`.
* **Train/Test Split:** 80% training / 20% testing (`random_state=42`).
* **Unified `ColumnTransformer` Pipeline:**

| Feature Group | Columns | Transformations |
| :--- | :--- | :--- |
| **Skewed Numerical** | `Study_Hours`, `Age`, `Sleep_Hours_Per_Night` | `FunctionTransformer(np.log1p)` followed by `StandardScaler()` |
| **Standard Numerical** | `Avg_Daily_Usage_Hours`, `Daily_Unlocks`, `Physical_Activity_Hours` | `StandardScaler()` |
| **Ordinal Categorical** | `Stress_Level` | `OrdinalEncoder` with order `['Low', 'Medium', 'High', 'Very High']` |
| **Nominal Categorical** | `Gender`, `Academic_Level`, `Most_Used_Platform`, `Purpose_Of_Use`, `Grouped_Country` | `OneHotEncoder(handle_unknown="ignore")` |

### 3. Model Comparison & Selection
Three regression setups were benchmarked on the holdout test set, including hyperparameter tuning via 5-fold `RandomizedSearchCV` (15 iterations):

| Model | Testing `$R^2$` | Training `$R^2$` | MAE | RMSE |
| :--- | :---: | :---: | :---: | :---: |
| **Linear Regression** | `0.7418` | `0.7224` | `0.5346` | `0.6789` |
| **Random Forest Regressor (Default)** | **`0.8899`** | `0.9828` | **`0.3281`** | **`0.4433`** |
| **Random Forest Regressor (Tuned)** | `0.8758` | `0.9564` | `0.3533` | `0.4709` |

*(Tuned best parameters found via randomized search: `n_estimators=300`, `max_depth=15`, `min_samples_split=5`, `min_samples_leaf=2`.)*

**Deployed Model:** The **Default Random Forest Regressor pipeline** was selected and serialized to `mental_health_model.pkl` using `joblib`, as it delivered the strongest generalization performance on the unseen test split (**`$R^2 = 0.8899$`**, **MAE = `0.33` points** on a 10-point scale).

### 4. Score Interpretation Tiers
Predictions returned by the backend are categorized as follows:
* **Thriving:** `$\text{Score} \ge 7.5$`
* **Balanced:** `$6.0 \le \text{Score} < 7.5$`
* **Moderate Strain:** `$4.5 \le \text{Score} < 6.0$`
* **High Strain:** `$\text{Score} < 4.5$`

---

## How to Use the Website

1. Visit **[https://mindpulse-mkvi.onrender.com/](https://mindpulse-mkvi.onrender.com/)**.
2. **Quick Test:** Click any preset button in the top bar (**Balanced**, **Exam Crunch**, or **Heavy Scroller**) to auto-fill realistic habits and immediately run a prediction.
3. **Custom Profile:**
   * **01 Student Profile:** Enter your age and choose gender, academic level, and country.
   * **02 Digital Habits:** Pick your most used social platform, primary purpose of use, daily screen time, and daily phone unlocks.
   * **03 Daily Routine & Stress:** Adjust the sliders for study hours, physical activity, and nightly sleep (keep an eye on the 24-hour activity meter), then select your stress level.
4. Click **Predict Mental Health Score** to view your predicted score, well-being category, and personalized habit signals.

---

## Project Structure

```text
MindPulse/
├── main.py                             # FastAPI backend (serves API + static frontend)
├── mental_health_model.pkl             # Serialized scikit-learn preprocessing + RF pipeline
├── requirements.txt                    # Python dependencies (pins scikit-learn==1.6.1)
├── .python-version                     # Pins Python 3.12.4 for pre-built Render wheels
├── data.csv                            # Dataset (5,000 student records)
├── MENTAL_HEALTH_PREDICTOR_CODE.ipynb  # EDA, feature engineering & model training notebook
├── .gitignore                          # Git ignore rules
├── README.md                           # Project documentation
└── static/
    ├── index.html                      # Frontend layout & form controls
    ├── style.css                       # Responsive UI styling & gauge transitions
    └── script.js                       # Slider sync, presets, validation & API integration
```

---

## Running Locally

### Prerequisites
* **Python 3.12.4** (or any Python `3.10`–`3.13` version compatible with `scikit-learn==1.6.1` binary wheels)
* `pip` and `git`

### Step-by-Step Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Harsh-Raj-Jordan/MindPulse.git
   cd MindPulse
   ```

2. **Create and activate a virtual environment (recommended):**
   ```bash
   # Windows (PowerShell)
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1

   # macOS / Linux
   python3 -m venv .venv
   source .venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Start the FastAPI server:**
   ```bash
   uvicorn main:app --reload
   ```

5. **Open in your browser:**
   * Web UI: `http://127.0.0.1:8000`
   * Swagger API Docs: `http://127.0.0.1:8000/docs`
   * Health Check: `http://127.0.0.1:8000/health`

---

## API Reference

### `GET /health`
Returns service status.
```json
{
  "status": "ok"
}
```

### `POST /predict`
Runs inference on a student profile and returns the predicted score, category, summary, and habit insights.

**Sample Request (`application/json`):**
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

**Sample Response (`200 OK`):**
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

## Deployment on Render

This repository is configured for zero-friction deployment as a **single Render Web Service**:

* **Runtime:** Python 3 (`PYTHON_VERSION=3.12.4`, matching `.python-version`)
* **Build Command:** `pip install -r requirements.txt`
* **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`

Pinning `PYTHON_VERSION` to `3.12.4` and `scikit-learn==1.6.1` guarantees fast installation via pre-built `cp312` binary wheels and ensures exact compatibility when unpickling `mental_health_model.pkl`.

---

## Disclaimer

MindPulse is designed strictly for **educational and exploratory machine learning purposes**. Predictions reflect statistical patterns learned from survey data and must **not** be treated as medical, psychological, or clinical advice.