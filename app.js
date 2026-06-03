const ctx = document.getElementById('confidenceChart');

new Chart(ctx, {
    type: 'doughnut',
    data: {
        labels: [
            'Bee',
            'Butterfly',
            'Other'
        ],
        datasets: [{
            data: [86, 8, 6],
            backgroundColor: [
                '#41A85F',
                '#FFD54F',
                '#90A4AE'
            ],
            borderWidth: 0
        }]
    },
    options: {
        responsive: true,
        plugins: {
            legend: {
                position: 'bottom'
            }
        }
    }
});

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

function showDemoCamera() {
    cameraHost = "";
    localStorage.removeItem(CAMERA_STORAGE_KEY);

    if (cameraHostInput) {
        cameraHostInput.value = "";
    }

    cameraFeed.src = CAMERA_PLACEHOLDER;
    setCameraStatus("Demo");
}

function refreshCameraFrame() {
    if (!cameraHost) {
        cameraFeed.src = CAMERA_PLACEHOLDER;
        setCameraStatus("Demo");
        return;
    }

    cameraFeed.src = cameraCaptureUrl();
    setCameraStatus("Live");
}

cameraFeed.addEventListener("error", () => {
    if (!cameraHost) return;

    cameraFeed.src = CAMERA_PLACEHOLDER;
    setCameraStatus("Offline", true);
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
