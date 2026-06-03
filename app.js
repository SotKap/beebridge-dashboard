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
    recommendationText: document.getElementById("recommendationText")
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

function updateConfidenceChart(chartData = demoState.ai.chart) {
    confidenceChart.data.datasets[0].data = [
        valueOrFallback(chartData.bee, demoState.ai.chart.bee),
        valueOrFallback(chartData.butterfly, demoState.ai.chart.butterfly),
        valueOrFallback(chartData.other, demoState.ai.chart.other)
    ];
    confidenceChart.update();
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
}

function hasFirebaseConfig() {
    return !Object.values(firebaseConfig).some((value) => value.startsWith("PASTE_"));
}

function startFirebase() {
    renderDashboard(demoState);

    if (!hasFirebaseConfig()) {
        setConnectionState("Demo", false);
        return;
    }

    try {
        const app = initializeApp(firebaseConfig);
        const database = getDatabase(app);
        const stationRef = ref(database, DATABASE_PATH);

        setConnectionState("Connecting", false);

        onValue(stationRef, (snapshot) => {
            const data = snapshot.val();
            renderDashboard(data || demoState);
            setConnectionState(data ? "Firebase" : "Demo", Boolean(data));
        }, (error) => {
            console.error("Firebase listener failed:", error);
            setConnectionState("Offline", false);
        });
    } catch (error) {
        console.error("Firebase initialization failed:", error);
        setConnectionState("Offline", false);
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

startFirebase();
