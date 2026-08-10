const API_URL = "https://student-mental-health-kz5f.onrender.com/predict";

const form = document.getElementById("predict-form");
const resultCard = document.getElementById("result-card");
const errorCard = document.getElementById("error-card");
const scoreValue = document.getElementById("score-value");
const scoreMessage = document.getElementById("score-message");
const apiStatus = document.getElementById("api-status");
const donutProgress = document.getElementById("donut-progress");
const donutScore = document.getElementById("donut-score");
const submitButton = form.querySelector("button[type='submit']");

function updateDonut(score) {
  const numericScore = Math.max(0, Math.min(10, Number(score) || 0));
  const circumference = 2 * Math.PI * 52;
  const offset = circumference - (numericScore / 10) * circumference;

  if (donutProgress) {
    donutProgress.style.strokeDasharray = `${circumference}`;
    donutProgress.style.strokeDashoffset = `${offset}`;
  }

  if (donutScore) {
    donutScore.textContent = numericScore.toFixed(1);
  }
}

function resetForm() {
  form.reset();

  const inputs = form.querySelectorAll("input, select");
  inputs.forEach((field) => {
    if (field.tagName === "SELECT") {
      field.value = "";
    }
  });
}

function showResult(score) {
  resultCard.classList.remove("hidden");
  errorCard.classList.add("hidden");

  const numericScore = Number(score);
  scoreValue.textContent = `${numericScore.toFixed(2)} / 10`;

  if (numericScore >= 7.5) {
    scoreMessage.textContent = "High concern level. Consider reaching out for support and balance.";
  } else if (numericScore >= 4.5) {
    scoreMessage.textContent = "Moderate concern level. Small positive steps can help.";
  } else {
    scoreMessage.textContent = "Low concern level. Keep your routine healthy and steady.";
  }

  updateDonut(numericScore);
}

function showError(message) {
  resultCard.classList.add("hidden");
  errorCard.classList.remove("hidden");
  errorCard.textContent = message;
}

function buildPayload() {
  return {
    age: Number(document.getElementById("age").value),
    gender: document.getElementById("gender").value,
    country: document.getElementById("country").value,
    academic_level: document.getElementById("academic_level").value,
    most_used_platform: document.getElementById("most_used_platform").value,
    purpose_of_use: document.getElementById("purpose_of_use").value,
    avg_daily_usage_hours: Number(document.getElementById("avg_daily_usage_hours").value),
    daily_unlocks: Number(document.getElementById("daily_unlocks").value),
    study_hours: Number(document.getElementById("study_hours").value),
    physical_activity_hours: Number(document.getElementById("physical_activity_hours").value),
    sleep_hours_per_night: Number(document.getElementById("sleep_hours_per_night").value),
    stress_level: document.getElementById("stress_level").value,
  };
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  submitButton.disabled = true;
  submitButton.textContent = "Predicting...";
  if (apiStatus) {
    apiStatus.textContent = "Sending request...";
  }

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildPayload()),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(data?.detail || "Prediction failed. Please try again.");
    }

    showResult(data?.predicted_mental_health_score ?? "No score returned");
    resetForm();
    if (apiStatus) {
      apiStatus.textContent = "Connected";
    }
  } catch (error) {
    showError(`Request failed: ${error.message}`);
    if (apiStatus) {
      apiStatus.textContent = "Connection issue";
    }
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Predict now";
  }
});

if (apiStatus) {
  apiStatus.textContent = "Ready";
}
