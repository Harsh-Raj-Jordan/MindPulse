const form = document.getElementById("predict-form");
const submitBtn = document.getElementById("submit-btn");
const btnText = submitBtn.querySelector(".btn-text");
const spinner = submitBtn.querySelector(".spinner");
const errorBanner = document.getElementById("error-banner");

const scoreValueEl = document.getElementById("score-value");
const statusBadgeEl = document.getElementById("status-badge");
const resultSummaryEl = document.getElementById("result-summary");
const insightsListEl = document.getElementById("insights-list");
const gaugeFillEl = document.getElementById("gauge-fill");

const metricSleepEl = document.getElementById("metric-sleep");
const metricScreenEl = document.getElementById("metric-screen");
const metricStudyEl = document.getElementById("metric-study");
const totalHoursEl = document.getElementById("total-hours");
const hoursMeterEl = document.getElementById("hours-meter");

const CIRCUMFERENCE = 2 * Math.PI * 76;

const SLIDER_IDS = [
  "avg_daily_usage_hours",
  "study_hours",
  "physical_activity_hours",
  "sleep_hours_per_night",
];

const PRESETS = {
  balanced: {
    age: 22,
    gender: "Female",
    country: "India",
    academic_level: "Undergraduate",
    most_used_platform: "LinkedIn",
    purpose_of_use: "Education",
    avg_daily_usage_hours: 2.2,
    daily_unlocks: 85,
    study_hours: 5.5,
    physical_activity_hours: 2.0,
    sleep_hours_per_night: 8.2,
    stress_level: "Low",
  },
  crunch: {
    age: 21,
    gender: "Male",
    country: "USA",
    academic_level: "Undergraduate",
    most_used_platform: "YouTube",
    purpose_of_use: "Education",
    avg_daily_usage_hours: 4.8,
    daily_unlocks: 155,
    study_hours: 7.5,
    physical_activity_hours: 0.7,
    sleep_hours_per_night: 5.8,
    stress_level: "High",
  },
  scroller: {
    age: 19,
    gender: "Male",
    country: "Canada",
    academic_level: "High School",
    most_used_platform: "Instagram",
    purpose_of_use: "Entertainment",
    avg_daily_usage_hours: 7.8,
    daily_unlocks: 240,
    study_hours: 1.2,
    physical_activity_hours: 0.8,
    sleep_hours_per_night: 5.1,
    stress_level: "Very High",
  },
};

function syncSliders() {
  let total = 0;
  SLIDER_IDS.forEach((id) => {
    const input = document.getElementById(id);
    const val = parseFloat(input.value);
    document.getElementById(`val-${id}`).textContent = `${val.toFixed(1)} hrs`;
    total += val;
  });

  metricSleepEl.textContent = `${parseFloat(document.getElementById("sleep_hours_per_night").value).toFixed(1)}h`;
  metricScreenEl.textContent = `${parseFloat(document.getElementById("avg_daily_usage_hours").value).toFixed(1)}h`;
  metricStudyEl.textContent = `${parseFloat(document.getElementById("study_hours").value).toFixed(1)}h`;

  totalHoursEl.textContent = `${total.toFixed(1)} / 24 hrs`;
  hoursMeterEl.classList.toggle("warn", total > 24);
}

SLIDER_IDS.forEach((id) => {
  document.getElementById(id).addEventListener("input", syncSliders);
});

document.querySelectorAll(".preset-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const preset = PRESETS[btn.dataset.preset];
    if (!preset) return;

    Object.entries(preset).forEach(([key, value]) => {
      if (key === "stress_level") {
        const radio = form.querySelector(`input[name="stress_level"][value="${value}"]`);
        if (radio) radio.checked = true;
      } else {
        const el = document.getElementById(key);
        if (el) el.value = value;
      }
    });

    syncSliders();
    form.requestSubmit();
  });
});

function setLoading(isLoading) {
  submitBtn.disabled = isLoading;
  btnText.textContent = isLoading ? "Calculating..." : "Predict Mental Health Score";
  spinner.classList.toggle("hidden", !isLoading);
}

function showError(message) {
  errorBanner.textContent = message;
  errorBanner.classList.remove("hidden");
}

function clearError() {
  errorBanner.textContent = "";
  errorBanner.classList.add("hidden");
}

function updateGauge(score, category) {
  const clamped = Math.max(0, Math.min(10, score));
  const offset = CIRCUMFERENCE * (1 - clamped / 10);
  gaugeFillEl.style.strokeDashoffset = offset.toFixed(2);

  let color = "#0d9488";
  let badgeClass = "balanced";

  if (clamped >= 7.5) {
    color = "#16a34a";
    badgeClass = "thriving";
  } else if (clamped >= 6.0) {
    color = "#0d9488";
    badgeClass = "balanced";
  } else if (clamped >= 4.5) {
    color = "#d97706";
    badgeClass = "moderate";
  } else {
    color = "#dc2626";
    badgeClass = "high";
  }

  gaugeFillEl.style.stroke = color;
  scoreValueEl.textContent = clamped.toFixed(2);
  scoreValueEl.style.color = color;

  statusBadgeEl.textContent = category;
  statusBadgeEl.className = `status-badge ${badgeClass}`;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearError();

  const stressEl = form.querySelector('input[name="stress_level"]:checked');
  const payload = {
    age: parseInt(document.getElementById("age").value, 10),
    gender: document.getElementById("gender").value,
    country: document.getElementById("country").value.trim() || "Other",
    academic_level: document.getElementById("academic_level").value,
    most_used_platform: document.getElementById("most_used_platform").value,
    purpose_of_use: document.getElementById("purpose_of_use").value,
    avg_daily_usage_hours: parseFloat(document.getElementById("avg_daily_usage_hours").value),
    daily_unlocks: parseInt(document.getElementById("daily_unlocks").value, 10),
    study_hours: parseFloat(document.getElementById("study_hours").value),
    physical_activity_hours: parseFloat(document.getElementById("physical_activity_hours").value),
    sleep_hours_per_night: parseFloat(document.getElementById("sleep_hours_per_night").value),
    stress_level: stressEl ? stressEl.value : "Medium",
  };

  if (Number.isNaN(payload.age) || payload.age < 8 || payload.age > 100) {
    showError("Please enter an age between 8 and 100.");
    return;
  }

  if (Number.isNaN(payload.daily_unlocks) || payload.daily_unlocks < 0) {
    showError("Daily unlocks must be 0 or greater.");
    return;
  }

  setLoading(true);
  try {
    const res = await fetch("/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || "Unable to compute prediction.");
    }

    updateGauge(data.predicted_mental_health_score, data.category);
    resultSummaryEl.textContent = data.summary;

    insightsListEl.innerHTML = "";
    data.insights.forEach((tip) => {
      const li = document.createElement("li");
      li.textContent = tip;
      insightsListEl.appendChild(li);
    });
  } catch (err) {
    showError(err.message || "Network error. Please try again in a moment.");
  } finally {
    setLoading(false);
  }
});

syncSliders();