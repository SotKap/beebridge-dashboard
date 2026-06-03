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

// Temporary local camera preview refresh.

setInterval(() => {

    const img = document.getElementById("cameraFeed");

    img.src =
        "assets/live-placeholder.jpg?time=" +
        new Date().getTime();

}, 5000);
