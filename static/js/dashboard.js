let incidentChart = null;

function load_incident_over_time(time) {
    let incidentCanvas = document.getElementById("incidentChart");
    let url = `http://127.0.0.1:8000/api/incident_analytics/?unit=${time}&query_type=IOT`;

    switch (time) {
        case 'hour':
            label = 'minutes';
            text = 'minutes';
            chartType = 'line';
            backgroundColor = 'rgba(75, 192, 192, 0.2)';
            borderColor = 'rgba(75, 192, 192, 1)';
            break;
        case 'day':
            label = 'hour';
            text = 'hour';
            chartType = 'line';
            backgroundColor = 'rgba(255, 192, 203, 0.4)';
            borderColor = 'rgba(255, 192, 203, 1)';
            break;
        case 'week':
            label = 'date';
            text = 'date';
            chartType = 'bar';
            backgroundColor = 'rgba(178, 223, 138, 0.4)';
            borderColor = 'rgba(178, 223, 138, 1)';
            break;
        case 'month':
            label = 'date';
            text = 'date';
            chartType = 'line';
            backgroundColor = 'rgba(204, 153, 0, 0.4)';
            borderColor = 'rgba(204, 153, 0, 1)';
            break;
        case 'year':
            label = 'month';
            text = 'month';
            chartType = 'bar';
            backgroundColor = 'rgba(255, 192, 203, 0.4)';
            borderColor = 'rgba(255, 192, 203, 1)';
            break;
    }

    if (incidentChart) {
        incidentChart.destroy();
    }

    fetch(url)
        .then(response => response.json())
        .then(data => {
            console.log(data);
            let labels = data.data.map(entry => {
                if (time === "hour") {
                    return entry.hour + ":" + entry.minute;
                } else if (time === "day") {
                    return entry.hour;
                } else if (time === "week" || time === "month") {
                    return entry.date;
                } else if (time === "year") {
                    return entry.month + " " + entry.year;
                }
            });
            let counts = data.data.map(entry => entry.count);
            incidentChart = new Chart(incidentCanvas, {
                type: chartType,
                data: {
                    labels: labels,
                    datasets: [{
                        label: label,
                        data: counts,
                        backgroundColor: backgroundColor,
                        borderColor: borderColor,
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: text
                            }
                        },
                        y: {
                            beginAtZero: true,
                            stepSize: 10,
                            precision: 0
                        }
                    }
                }
            });
        })
        .catch(error => {
            // console.error("Error retrieving incident data:", error);
        });
}

document.addEventListener("DOMContentLoaded", function () {
    let unit = document.getElementById("unitSelect");
    let updateButton = document.getElementById("update-incidents-over-time");

    updateButton.addEventListener("click", function () {
        load_incident_over_time(unit.value);
    });

    unit.value = "week";
    load_incident_over_time(unit.value);
});

fetch('http://127.0.0.1:8000/api/incident_analytics/?query_type=IDF')
    .then(response => response.json())
    .then(data => {
        const chartData = [data.undentified_incidents, data.identified_incidents];
        const ctx = document.getElementById('Identifiedvsunidentified').getContext('2d');
        new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Unidentified Incidents', 'Identified Incidents'],
                datasets: [{
                    data: chartData,
                    backgroundColor: ['#FF6384', '#36A2EB'],
                    hoverBackgroundColor: ['#FF6384', '#36A2EB']
                }]
            },
            options: {
                responsive: true,
                legend: {
                    position: 'top',
                },
                animation: {
                    animateScale: true,
                    animateRotate: true
                }
            }
        });
    })
    .catch(error => console.error('Error:', error));


fetch('http://127.0.0.1:8000/api/incident_analytics/?query_type=RID')
    .then(response => response.json())
    .then(data => {
        const tbody = document.getElementById('incident-table').getElementsByTagName('tbody')[0];

        for (let incident of data) {
            let row = tbody.insertRow();

            let idCell = row.insertCell();
            idCell.textContent = incident.id;

            let timestampCell = row.insertCell();
            let date = new Date(incident.timestamp);
            timestampCell.textContent = date.toLocaleDateString('en-GB') + ' at ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

            let videoPathCell = row.insertCell();
            let link = document.createElement('a');
            link.href = `http://127.0.0.1:8000/${incident.video_path}`;
            link.innerHTML = '<i class="fa fa-eye"></i>';
            videoPathCell.appendChild(link);
        }
    })
    .catch(error => console.error('Error:', error));

fetch('http://127.0.0.1:8000/api/incident_analytics/?query_type=IBC')
    .then(response => response.json())
    .then(data => {
        document.getElementById('no-vest-count').innerText = data["No-Vest"];
        document.getElementById('no-helmet-count').innerText = data["No-Helmet"];
        document.getElementById('restricted-area-count').innerText = data["Restricted area"];
    })
    .catch(error => console.error('Error:', error));