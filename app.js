import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, onValue, ref } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyCY5z0-aa7mPZg5ViT-6G6HoVkbjXhHEhs",
    authDomain: "beebridge-fbf07.firebaseapp.com",
    databaseURL: "https://beebridge-fbf07-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "beebridge-fbf07",
    storageBucket: "beebridge-fbf07.firebasestorage.app",
    messagingSenderId: "63521687188",
    appId: "1:63521687188:web:284d8dd08231a66f2e9681",
    measurementId: "G-EYMW4SS6W1"
};

const DATABASE_PATH = "beebridge/station";

const demoState = {
    ai: {
        className: "Bee",
        confidencePercent: 86,
        lastVisit: "10:42:26",
        autoCount: true,
        chart: {
            bee: 86,
            butterfly: 8,
            other: 6
        }
    },
    visits: {
        pollinators: 12,
        bees: 8,
        butterflies: 3,
        otherInsects: 1,
        empty: 27
    },
    environment: {
        temperatureC: 25.1,
        humidityPercent: 48,
        lightLux: 720,
        uvIndex: 0.0,
        soilMoisturePercent: 42,
    },
    power: {
        batteryPercent: 76
    },
    score: 82,
    recommendation: {
        text: "Soil is getting dry. Water plants this afternoon."
    }
};

const elements = {
    homeView: document.getElementById("homeView"),
    analyticsView: document.getElementById("analyticsView"),
    connectionLabel: document.getElementById("connectionLabel"),
    connectionDot: document.getElementById("connectionDot"),
    className: document.getElementById("className"),
    confidence: document.getElementById("confidence"),
    lastVisit: document.getElementById("lastVisit"),
    autoCount: document.getElementById("autoCount"),
    visitPollinators: document.getElementById("visitPollinators"),
    visitBees: document.getElementById("visitBees"),
    visitButterflies: document.getElementById("visitButterflies"),
    visitOtherInsects: document.getElementById("visitOtherInsects"),
    visitEmpty: document.getElementById("visitEmpty"),
    temperatureValue: document.getElementById("temperatureValue"),
    humidityValue: document.getElementById("humidityValue"),
    lightValue: document.getElementById("lightValue"),
    uvValue: document.getElementById("uvValue"),
    soilValue: document.getElementById("soilValue"),
    batteryValue: document.getElementById("batteryValue"),
    scoreValue: document.getElementById("scoreValue"),
    recommendationText: document.getElementById("recommendationText"),
    climateUpdated: document.getElementById("climateUpdated"),
    lightUpdated: document.getElementById("lightUpdated"),
    analyticsPeak: document.getElementById("analyticsPeak"),
    analyticsPeakHint: document.getElementById("analyticsPeakHint"),
    analyticsMainVisitor: document.getElementById("analyticsMainVisitor"),
    analyticsVisitorHint: document.getElementById("analyticsVisitorHint"),
    analyticsScore: document.getElementById("analyticsScore"),
    analyticsScoreHint: document.getElementById("analyticsScoreHint"),
    analyticsBattery: document.getElementById("analyticsBattery"),
    analyticsInsightTitle: document.getElementById("analyticsInsightTitle"),
    analyticsInsightText: document.getElementById("analyticsInsightText"),
    analyticsClimateNote: document.getElementById("analyticsClimateNote"),
    analyticsSoilNote: document.getElementById("analyticsSoilNote"),
    analyticsLightNote: document.getElementById("analyticsLightNote")
};

const ctx = document.getElementById("confidenceChart");
const confidenceChart = new Chart(ctx, {
    type: "doughnut",
    data: {
        labels: ["Bee", "Butterfly", "Other"],
        datasets: [{
            data: [
                demoState.ai.chart.bee,
                demoState.ai.chart.butterfly,
                demoState.ai.chart.other
            ],
            backgroundColor: ["#41A85F", "#FFD54F", "#90A4AE"],
            borderWidth: 0
        }]
    },
    options: {
        responsive: true,
        plugins: {
            legend: {
                position: "bottom"
            }
        }
    }
});

const chartTheme = {
    green: "#41A85F",
    greenDark: "#2F8C4A",
    yellow: "#F5A623",
    blue: "#54B7E8",
    grey: "#90A4AE",
    grid: "#E6ECE7",
    text: "#7C8A82"
};

const historyLimit = 18;
const sensorHistory = {
    labels: [],
    temperature: [],
    humidity: [],
    light: [],
    uv: [],
    soil: []
};

function makeGradient(chart, color) {
    const { ctx: chartCtx, chartArea } = chart;

    if (!chartArea) return color;

    const gradient = chartCtx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
    return gradient;
}

function baseLineOptions() {
    return {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
            duration: 450
        },
        interaction: {
            mode: "index",
            intersect: false
        },
        plugins: {
            legend: {
                position: "bottom",
                labels: {
                    usePointStyle: true,
                    boxWidth: 8,
                    boxHeight: 8,
                    color: chartTheme.text,
                    font: {
                        family: "Inter",
                        weight: 700
                    }
                }
            },
            tooltip: {
                backgroundColor: "rgba(31, 42, 36, 0.92)",
                padding: 12,
                titleFont: {
                    family: "Inter",
                    weight: 800
                },
                bodyFont: {
                    family: "Inter",
                    weight: 700
                }
            }
        },
        scales: {
            x: {
                grid: {
                    display: false
                },
                ticks: {
                    color: chartTheme.text,
                    maxRotation: 0,
                    autoSkip: true,
                    maxTicksLimit: 6,
                    font: {
                        family: "Inter",
                        weight: 700
                    }
                }
            },
            y: {
                beginAtZero: false,
                grid: {
                    color: chartTheme.grid
                },
                ticks: {
                    color: chartTheme.text,
                    font: {
                        family: "Inter",
                        weight: 700
                    }
                }
            }
        }
    };
}

const climateChart = new Chart(document.getElementById("climateChart"), {
    type: "line",
    data: {
        labels: sensorHistory.labels,
        datasets: [
            {
                label: "Temperature °C",
                data: sensorHistory.temperature,
                borderColor: chartTheme.yellow,
                backgroundColor: (context) => makeGradient(context.chart, "rgba(245, 166, 35, 0.22)"),
                borderWidth: 3,
                pointRadius: 0,
                pointHoverRadius: 5,
                tension: 0.38,
                fill: true
            },
            {
                label: "Humidity %",
                data: sensorHistory.humidity,
                borderColor: chartTheme.blue,
                backgroundColor: (context) => makeGradient(context.chart, "rgba(84, 183, 232, 0.16)"),
                borderWidth: 3,
                pointRadius: 0,
                pointHoverRadius: 5,
                tension: 0.38,
                fill: true
            }
        ]
    },
    options: baseLineOptions()
});

const lightSoilOptions = baseLineOptions();
lightSoilOptions.scales.y.beginAtZero = true;
lightSoilOptions.scales.y1 = {
    beginAtZero: true,
    position: "right",
    grid: {
        drawOnChartArea: false
    },
    ticks: {
        color: chartTheme.text,
        font: {
            family: "Inter",
            weight: 700
        }
    }
};

const lightSoilChart = new Chart(document.getElementById("lightSoilChart"), {
    type: "line",
    data: {
        labels: sensorHistory.labels,
        datasets: [
            {
                label: "Light lux",
                data: sensorHistory.light,
                borderColor: chartTheme.yellow,
                backgroundColor: (context) => makeGradient(context.chart, "rgba(245, 166, 35, 0.2)"),
                borderWidth: 3,
                pointRadius: 0,
                pointHoverRadius: 5,
                tension: 0.38,
                fill: true,
                yAxisID: "y"
            },
            {
                label: "Soil %",
                data: sensorHistory.soil,
                borderColor: chartTheme.green,
                backgroundColor: (context) => makeGradient(context.chart, "rgba(65, 168, 95, 0.16)"),
                borderWidth: 3,
                pointRadius: 0,
                pointHoverRadius: 5,
                tension: 0.38,
                fill: true,
                yAxisID: "y1"
            },
            {
                label: "UV",
                data: sensorHistory.uv,
                borderColor: chartTheme.grey,
                borderWidth: 2,
                borderDash: [5, 5],
                pointRadius: 0,
                pointHoverRadius: 5,
                tension: 0.38,
                fill: false,
                yAxisID: "y1"
            }
        ]
    },
    options: lightSoilOptions
});

function valueOrFallback(value, fallback) {
    return value === undefined || value === null || value === "" ? fallback : value;
}

function formatNumber(value, digits = 0) {
    if (typeof value !== "number") return value;
    return Number.isInteger(value) ? String(value) : value.toFixed(digits);
}

function setText(element, value) {
    if (element) {
        element.textContent = value;
    }
}

function setConnectionState(label, isOnline) {
    setText(elements.connectionLabel, label);

    if (elements.connectionDot) {
        elements.connectionDot.classList.toggle("offline", !isOnline);
    }
}

function resizeAnalyticsCharts() {
    if (!elements.analyticsView || elements.analyticsView.hidden) return;

    requestAnimationFrame(() => {
        if (typeof climateChart.resize === "function") {
            climateChart.resize();
        }

        if (typeof lightSoilChart.resize === "function") {
            lightSoilChart.resize();
        }

        climateChart.update("none");
        lightSoilChart.update("none");
    });
}

function handleViewChange(event) {
    if (event.detail?.view === "analytics") {
        requestAnimationFrame(() => {
            resizeAnalyticsCharts();
        });
    }
}

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function updateConfidenceChart(chartData = demoState.ai.chart) {
    confidenceChart.data.datasets[0].data = [
        valueOrFallback(chartData.bee, demoState.ai.chart.bee),
        valueOrFallback(chartData.butterfly, demoState.ai.chart.butterfly),
        valueOrFallback(chartData.other, demoState.ai.chart.other)
    ];
    confidenceChart.update();
}

function toFiniteNumber(value, fallback) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
}

function trimSensorHistory() {
    while (sensorHistory.labels.length > historyLimit) {
        sensorHistory.labels.shift();
        sensorHistory.temperature.shift();
        sensorHistory.humidity.shift();
        sensorHistory.light.shift();
        sensorHistory.uv.shift();
        sensorHistory.soil.shift();
    }
}

function updateLiveCharts(values) {
    const label = new Date().toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    });

    sensorHistory.labels.push(label);
    sensorHistory.temperature.push(toFiniteNumber(values.temperature, demoState.environment.temperatureC));
    sensorHistory.humidity.push(toFiniteNumber(values.humidity, demoState.environment.humidityPercent));
    sensorHistory.light.push(toFiniteNumber(values.light, demoState.environment.lightLux));
    sensorHistory.uv.push(toFiniteNumber(values.uvIndex, demoState.environment.uvIndex));
    sensorHistory.soil.push(toFiniteNumber(values.soil, demoState.environment.soilMoisturePercent));
    trimSensorHistory();

    climateChart.update();
    lightSoilChart.update();
    setText(elements.climateUpdated, label);
    setText(elements.lightUpdated, label);
}

function buildAnalyticsInsight({ temperature, humidity, light, soil }) {
    if (soil < 35) {
        return {
            title: "Soil is running dry",
            text: "Moisture is low, so nearby plants may offer less nectar unless they are watered soon."
        };
    }

    if (temperature > 30) {
        return {
            title: "Warm activity window",
            text: "Temperature is high. Pollinator visits may concentrate earlier or later in the day."
        };
    }

    if (humidity < 35) {
        return {
            title: "Dry air conditions",
            text: "Humidity is low. Watch whether visits change as plants and insects respond to drier air."
        };
    }

    if (light > 700) {
        return {
            title: "Bright foraging conditions",
            text: "Light levels are strong, which can support visibility and active flower visits."
        };
    }

    return {
        title: "Balanced conditions",
        text: "Temperature, humidity, and soil moisture are within a comfortable monitoring range."
    };
}

function updateAnalyticsSummary({ className, confidence, visits, temperature, humidity, light, soil, battery, score }) {
    const pollinators = valueOrFallback(visits.pollinators, demoState.visits.pollinators);
    const insight = buildAnalyticsInsight({ temperature, humidity, light, soil });

    setText(elements.analyticsPeak, `${formatNumber(pollinators)} visits`);
    setText(elements.analyticsPeakHint, "Pollinator traffic today");
    setText(elements.analyticsMainVisitor, className);
    setText(elements.analyticsVisitorHint, `${formatNumber(confidence)}% AI confidence`);
    setText(elements.analyticsScore, `${formatNumber(score)} / 100`);
    setText(elements.analyticsScoreHint, score >= 80 ? "Healthy habitat signal" : "Needs attention");
    setText(elements.analyticsBattery, `${formatNumber(battery)}%`);
    setText(elements.analyticsInsightTitle, insight.title);
    setText(elements.analyticsInsightText, insight.text);
    setText(elements.analyticsClimateNote, `${formatNumber(temperature, 1)}°C and ${formatNumber(humidity)}% humidity right now.`);
    setText(elements.analyticsSoilNote, soil >= 40 ? `Soil moisture is stable at ${formatNumber(soil)}%.` : `Soil moisture is low at ${formatNumber(soil)}%.`);
    setText(elements.analyticsLightNote, `${formatNumber(light)} lux measured at the station.`);
}

function renderDashboard(data = demoState) {
    const ai = data.ai || demoState.ai;
    const visits = data.visits || demoState.visits;
    const environment = data.environment || demoState.environment;
    const power = data.power || demoState.power;
    const recommendation = data.recommendation || demoState.recommendation;

    const className = valueOrFallback(ai.className, demoState.ai.className);
    const confidence = valueOrFallback(ai.confidencePercent, demoState.ai.confidencePercent);
    const lastVisit = valueOrFallback(ai.lastVisit, demoState.ai.lastVisit);
    const autoCount = valueOrFallback(ai.autoCount, demoState.ai.autoCount);
    const temperature = valueOrFallback(environment.temperatureC, demoState.environment.temperatureC);
    const humidity = valueOrFallback(environment.humidityPercent, demoState.environment.humidityPercent);
    const light = valueOrFallback(
        environment.lightLux ?? environment.visibleLight,
        demoState.environment.lightLux
    );
    const uvIndex = valueOrFallback(environment.uvIndex, demoState.environment.uvIndex);
    const soil = valueOrFallback(
        environment.soilMoisturePercent,
        demoState.environment.soilMoisturePercent
    );
    const battery = valueOrFallback(power.batteryPercent, demoState.power.batteryPercent);
    const score = valueOrFallback(data.score, demoState.score);

    setText(elements.className, className);
    setText(elements.confidence, `${formatNumber(confidence)}%`);
    setText(elements.lastVisit, lastVisit);
    setText(elements.autoCount, autoCount ? "✓" : "–");
    setText(elements.visitPollinators, valueOrFallback(visits.pollinators, demoState.visits.pollinators));
    setText(elements.visitBees, valueOrFallback(visits.bees, demoState.visits.bees));
    setText(elements.visitButterflies, valueOrFallback(visits.butterflies, demoState.visits.butterflies));
    setText(elements.visitOtherInsects, valueOrFallback(visits.otherInsects, demoState.visits.otherInsects));
    setText(elements.visitEmpty, valueOrFallback(visits.empty, demoState.visits.empty));
    setText(elements.temperatureValue, `${formatNumber(temperature, 1)}°C`);
    setText(elements.humidityValue, `${formatNumber(humidity)}%`);
    setText(elements.lightValue, `${formatNumber(light)} lux`);
    setText(elements.uvValue, formatNumber(uvIndex, 1));
    setText(elements.soilValue, `${formatNumber(soil)}%`);
    setText(elements.batteryValue, `${formatNumber(battery)}%`);
    setText(elements.scoreValue, `${formatNumber(score)} / 100`);
    setText(elements.recommendationText, valueOrFallback(recommendation.text, demoState.recommendation.text));
    updateConfidenceChart(ai.chart);
    updateLiveCharts({ temperature, humidity, light, uvIndex, soil });
    updateAnalyticsSummary({ className, confidence, visits, temperature, humidity, light, soil, battery, score });
}

function hasFirebaseConfig() {
    return !Object.values(firebaseConfig).some((value) => value.startsWith("PASTE_"));
}

let demoStreamId = null;

function createDemoSnapshot() {
    const t = Date.now() / 1000;
    const temperature = 25.1 + Math.sin(t / 18) * 1.3 + Math.sin(t / 7) * 0.25;
    const humidity = 46 + Math.cos(t / 21) * 8;
    const light = 610 + Math.sin(t / 15) * 180 + Math.cos(t / 5) * 26;
    const uvIndex = clamp(0.4 + Math.sin(t / 24) * 0.35, 0, 1.2);
    const soil = 42 + Math.cos(t / 32) * 4;
    const confidence = clamp(82 + Math.sin(t / 9) * 8, 68, 96);
    const bees = 8 + Math.max(0, Math.floor(Math.sin(t / 22) * 3));
    const butterflies = 3 + Math.max(0, Math.floor(Math.cos(t / 34) * 2));
    const otherInsects = 1 + Math.max(0, Math.floor(Math.sin(t / 29) * 2));

    return {
        ...demoState,
        ai: {
            ...demoState.ai,
            confidencePercent: confidence,
            lastVisit: new Date().toLocaleTimeString("en-GB"),
            chart: {
                bee: confidence,
                butterfly: clamp(100 - confidence - 6, 3, 20),
                other: 6
            }
        },
        visits: {
            pollinators: bees + butterflies + otherInsects,
            bees,
            butterflies,
            otherInsects,
            empty: 27 + Math.max(0, Math.floor(Math.cos(t / 17) * 4))
        },
        environment: {
            temperatureC: temperature,
            humidityPercent: humidity,
            lightLux: light,
            uvIndex,
            soilMoisturePercent: soil
        },
        power: {
            batteryPercent: 76 - Math.max(0, Math.floor((t % 240) / 80))
        },
        score: clamp(82 + Math.sin(t / 30) * 5, 72, 92)
    };
}

function startDemoStream() {
    if (demoStreamId) return;

    renderDashboard(createDemoSnapshot());
    demoStreamId = setInterval(() => {
        renderDashboard(createDemoSnapshot());
    }, 4000);
}

function stopDemoStream() {
    if (!demoStreamId) return;

    clearInterval(demoStreamId);
    demoStreamId = null;
}

function startFirebase() {
    if (!hasFirebaseConfig()) {
        setConnectionState("Demo", false);
        startDemoStream();
        return;
    }

    try {
        const app = initializeApp(firebaseConfig);
        const database = getDatabase(app);
        const stationRef = ref(database, DATABASE_PATH);

        setConnectionState("Connecting", false);

        onValue(stationRef, (snapshot) => {
            const data = snapshot.val();

            if (data) {
                stopDemoStream();
                renderDashboard(data);
                setConnectionState("Firebase", true);
                return;
            }

            setConnectionState("Demo", false);
            startDemoStream();
        }, (error) => {
            console.error("Firebase listener failed:", error);
            setConnectionState("Offline", false);
            startDemoStream();
        });
    } catch (error) {
        console.error("Firebase initialization failed:", error);
        setConnectionState("Offline", false);
        startDemoStream();
    }
}

function updateCameraTime() {
    const cameraTime = document.querySelector(".camera-time");
    if (!cameraTime) return;

    cameraTime.textContent = new Date().toLocaleTimeString("en-GB");
}

updateCameraTime();
setInterval(updateCameraTime, 1000);

const CAMERA_PLACEHOLDER = "assets/live-placeholder.jpg";
const CAMERA_STORAGE_KEY = "beebridgeCameraHost";
const cameraFeed = document.getElementById("cameraFeed");
const cameraHostInput = document.getElementById("cameraHost");
const cameraStatus = document.getElementById("cameraStatus");
const connectCameraButton = document.getElementById("connectCamera");
const resetCameraButton = document.getElementById("resetCamera");
const cameraControls = document.querySelector(".camera-controls");
const cameraSummary = document.getElementById("cameraSummary");
const cameraAddress = document.getElementById("cameraAddress");
const changeCameraButton = document.getElementById("changeCamera");

let cameraHost = localStorage.getItem(CAMERA_STORAGE_KEY) || "";

function normalizeCameraHost(value) {
    return value
        .trim()
        .replace(/^https?:\/\//, "")
        .replace(/\/capture\/?$/, "")
        .replace(/\/$/, "");
}

function cameraCaptureUrl() {
    return `http://${cameraHost}/capture?time=${Date.now()}`;
}

function setCameraStatus(label, isOffline = false) {
    if (!cameraStatus) return;

    cameraStatus.textContent = label;
    cameraStatus.classList.toggle("offline", isOffline);
}

function showCameraControls() {
    if (cameraControls) {
        cameraControls.hidden = false;
    }

    if (cameraSummary) {
        cameraSummary.hidden = true;
    }
}

function showCameraSummary() {
    if (!cameraHost) return;

    if (cameraAddress) {
        cameraAddress.textContent = cameraHost;
    }

    if (cameraControls) {
        cameraControls.hidden = true;
    }

    if (cameraSummary) {
        cameraSummary.hidden = false;
    }
}

function showDemoCamera() {
    cameraHost = "";
    localStorage.removeItem(CAMERA_STORAGE_KEY);

    if (cameraHostInput) {
        cameraHostInput.value = "";
    }

    cameraFeed.src = CAMERA_PLACEHOLDER;
    setCameraStatus("Demo");
    showCameraControls();
}

function refreshCameraFrame() {
    if (!cameraHost) {
        cameraFeed.src = CAMERA_PLACEHOLDER;
        setCameraStatus("Demo");
        return;
    }

    cameraFeed.src = cameraCaptureUrl();

    if (!cameraSummary || cameraSummary.hidden) {
        setCameraStatus("Connecting");
    }
}

cameraFeed.addEventListener("load", () => {
    if (!cameraHost || cameraFeed.src.includes(CAMERA_PLACEHOLDER)) return;

    setCameraStatus("Live");
    showCameraSummary();
});

cameraFeed.addEventListener("error", () => {
    if (!cameraHost) return;

    cameraFeed.src = CAMERA_PLACEHOLDER;
    setCameraStatus("Offline", true);
    showCameraControls();
});

connectCameraButton.addEventListener("click", () => {
    const nextHost = normalizeCameraHost(cameraHostInput.value);

    if (!nextHost) {
        showDemoCamera();
        return;
    }

    cameraHost = nextHost;
    cameraHostInput.value = cameraHost;
    localStorage.setItem(CAMERA_STORAGE_KEY, cameraHost);
    refreshCameraFrame();
});

resetCameraButton.addEventListener("click", showDemoCamera);

changeCameraButton.addEventListener("click", () => {
    if (cameraHostInput) {
        cameraHostInput.value = cameraHost;
    }

    showCameraControls();
});

cameraHostInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        connectCameraButton.click();
    }
});

if (cameraHost) {
    cameraHostInput.value = cameraHost;
    refreshCameraFrame();
}

setInterval(() => {
    refreshCameraFrame();
}, 3000);

window.addEventListener("beebridge:viewchange", handleViewChange);

startFirebase();
