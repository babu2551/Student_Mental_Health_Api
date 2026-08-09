const apiUrl = "https://student-mental-health-api-1.onrender.com/predict";
const form = document.getElementById("predict-form");
const resultSection = document.getElementById("result");
const errorSection = document.getElementById("error");
const predictionValue = document.getElementById("prediction-value");
const predictionMessage = document.getElementById("prediction-message");
const chartFill = document.getElementById("chart-fill");
const chartPercent = document.getElementById("chart-percent");

function setChartFill(percent) {
    const safePercent = Math.min(100, Math.max(0, percent));
    const gradient = `conic-gradient(#7c3aed 0deg ${safePercent * 3.6}deg, rgba(59, 130, 246, 0.18) ${safePercent * 3.6}deg 360deg)`;
    chartFill.style.background = gradient;
    chartPercent.textContent = `${safePercent.toFixed(0)}%`;
}

function showResult(score) {
    const displayValue = Number(score);
    const scoreText = Number.isNaN(displayValue) ? String(score) : `${displayValue.toFixed(2)} / 10`;
    predictionValue.textContent = scoreText;
    predictionMessage.textContent = "This is the predicted mental health score from the API.";

    let numericScore = Number(score);
    if (Number.isNaN(numericScore)) {
        numericScore = 0;
    }

    const percent = Math.min(100, Math.max(0, numericScore * 10));
    setChartFill(percent);

    resultSection.classList.remove("hidden");
    errorSection.classList.add("hidden");
}

function showError(message) {
    errorSection.textContent = message;
    errorSection.classList.remove("hidden");
    resultSection.classList.add("hidden");
}

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const body = {
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

    try {
        const response = await fetch(apiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            const errorMessage = errorData?.detail || response.statusText || "Could not get a response from the API.";
            showError(`API error: ${errorMessage}`);
            return;
        }

        const data = await response.json();
        showResult(data.predicted_mental_health_score ?? "No score returned");
    } catch (error) {
        showError(`Request failed: ${error.message}`);
    }
});
