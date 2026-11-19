from pathlib import Path
from typing import Literal

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "mental_health_model.pkl"
STATIC_DIR = BASE_DIR / "static"

model = joblib.load(MODEL_PATH)

TOP_COUNTRIES = {
    "Other",
    "India",
    "USA",
    "Canada",
    "Australia",
    "UK",
    "Germany",
    "Mexico",
    "Turkey",
    "France",
}

app = FastAPI(title="Student Mental Health Predictor", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


class StudentData(BaseModel):
    age: int = Field(..., ge=8, le=100)
    gender: Literal["Male", "Female"]
    country: str = Field(..., min_length=1, max_length=60)
    academic_level: Literal["Undergraduate", "Graduate", "High School"]
    most_used_platform: Literal[
        "Facebook",
        "LinkedIn",
        "Instagram",
        "Snapchat",
        "Twitter",
        "YouTube",
        "TikTok",
        "LINE",
        "KakaoTalk",
        "VKontakte",
        "WhatsApp",
        "WeChat",
    ]
    purpose_of_use: Literal["Networking", "Education", "Entertainment", "News"]
    avg_daily_usage_hours: float = Field(..., ge=0, le=24)
    daily_unlocks: int = Field(..., ge=0, le=1000)
    study_hours: float = Field(..., ge=0, le=24)
    physical_activity_hours: float = Field(..., ge=0, le=24)
    sleep_hours_per_night: float = Field(..., ge=0, le=24)
    stress_level: Literal["Low", "Medium", "High", "Very High"]


class PredictionResponse(BaseModel):
    predicted_mental_health_score: float
    category: str
    summary: str
    insights: list[str]


def build_feedback(score: float, data: StudentData) -> tuple[str, str, list[str]]:
    if score >= 7.5:
        category = "Thriving"
        summary = "Your daily routine shows strong balance between rest, focus, and screen habits."
    elif score >= 6.0:
        category = "Balanced"
        summary = "Overall well-being looks steady, with a few areas you can fine-tune."
    elif score >= 4.5:
        category = "Moderate Strain"
        summary = "Your current habits point toward elevated mental fatigue or digital overload."
    else:
        category = "High Strain"
        summary = "Multiple lifestyle signals suggest significant strain—prioritizing recovery is key."

    insights: list[str] = []
    if data.sleep_hours_per_night < 7.0:
        insights.append("Sleep is under 7 hours; aiming for 7–8.5 hours strongly supports mood and focus.")
    elif data.sleep_hours_per_night >= 7.5:
        insights.append("Consistent sleep duration is acting as a major protective factor.")

    if data.avg_daily_usage_hours >= 5.5 or data.daily_unlocks >= 180:
        insights.append("High screen time or frequent phone unlocks can fragment attention and elevate stress.")
    else:
        insights.append("Digital usage stays within a manageable daily range.")

    if data.physical_activity_hours < 1.0:
        insights.append("Adding 30–60 minutes of daily movement can meaningfully reduce perceived stress.")
    else:
        insights.append("Regular physical activity is helping buffer daily academic pressure.")

    if data.stress_level in {"High", "Very High"}:
        insights.append("Self-reported stress is elevated—short offline breaks between study blocks can help.")

    return category, summary, insights[:3]


@app.get("/", include_in_schema=False)
def serve_frontend():
    return FileResponse(STATIC_DIR / "index.html")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/predict", response_model=PredictionResponse)
def predict(data: StudentData):
    country_clean = data.country.strip()
    country_group = country_clean if country_clean in TOP_COUNTRIES else "Other"

    # Matches the exact 12 feature names expected by mental_health_model.pkl
    input_row = pd.DataFrame(
        [
            {
                "Study_Hours": data.study_hours,
                "Age": data.age,
                "Sleep_Hours_Per_Night": data.sleep_hours_per_night,
                "Avg_Daily_Usage_Hours": data.avg_daily_usage_hours,
                "Daily_Unlocks": data.daily_unlocks,
                "Physical_Activity_Hours": data.physical_activity_hours,
                "Stress_Level": data.stress_level,
                "Gender": data.gender,
                "Academic_Level": data.academic_level,
                "Most_Used_Platform": data.most_used_platform,
                "Purpose_Of_Use": data.purpose_of_use,
                "Grouped_Country": country_group,
            }
        ]
    )

    try:
        raw_prediction = float(model.predict(input_row)[0])
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {exc}") from exc

    score = round(max(0.0, min(10.0, raw_prediction)), 2)
    category, summary, insights = build_feedback(score, data)

    return PredictionResponse(
        predicted_mental_health_score=score,
        category=category,
        summary=summary,
        insights=insights,
    )