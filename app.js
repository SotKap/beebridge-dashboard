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


// προσωρινή ανανέωση εικόνας

setInterval(() => {

    const img = document.getElementById("cameraFeed");

    img.src =
        "https://placehold.co/800x600?time=" +
        new Date().getTime();

}, 5000);
