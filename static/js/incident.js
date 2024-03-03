function fetchIncidents(pageNumber = 1) {
    fetch(`http://127.0.0.1:8000/api/incident/?page=${pageNumber}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        return Promise.all(data.map(item => {
            return fetchCamera(item.camera)
                .then(cameraData => {
                    return { incident: item, camera: cameraData };
                })
                .catch(error => {
                    console.error('Error fetching camera data:', error);
                    return { incident: item, camera: null };
                });
        }));
    })
    .then(incidentsWithCameras => {
        const tbody = document.querySelector('.table tbody');
        tbody.innerHTML = '';
    
        incidentsWithCameras.forEach(({ incident, camera }) => {
            let date = new Date(incident.timestamp);
            const row = document.createElement('tr');
            row.setAttribute('data-bs-toggle', 'modal');
            row.setAttribute('data-bs-target', '#incidentModal');
            // row.setAttribute('role', 'button');
            row.innerHTML = `
                <td>${incident.id}</td>
                <td>${camera ? camera.name : 'N/A'}</td>
                <td>${camera ? camera.location : 'N/A'}</td>
                <td>${date.toLocaleDateString('en-GB') + ' at ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</td>
                <td><button class="btn btn-secondary btn-sm z-1" id='${incident.id}'><i class="fa fa-search"></i> Identify</button></td>
            `;
            tbody.appendChild(row);
    
            
            const identifyButton = document.getElementById(`${incident.id}`);
            identifyButton.addEventListener('click', function(event) {
                event.stopPropagation(); 
                postIncidentData(incident.id, incident.video_path.split('/').pop().split('.').slice(0, -1).join('.'), camera.email_alert);
            });

            row.addEventListener('click', function() {
                populateModalWithIncidentData(incident, camera); 
            });
        });
    
        if (incidentsWithCameras.length === 10) {
            createPagination(pageNumber + 1);
        } else if (incidentsWithCameras.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = '<td colspan="5"><h5 class="text-center">No Incidents Were Found</h5></td>';
            tbody.appendChild(row);
        }
    })
    .catch(error => {
        console.error('Error fetching incident data:', error);
    });
    
}

fetchIncidents(1);

function fetchCamera(cameraId) {
    return fetch(`http://127.0.0.1:8000/api/camera/${cameraId}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        return data;
    });
}

function populateModalWithIncidentData(incidentData, cameraData) {
    document.getElementById("incidentIdCell").textContent = incidentData.id;
    document.getElementById("cameraNameCell").textContent = cameraData ? cameraData.name || 'N/A' : 'N/A';
    document.getElementById("cameraLocationCell").textContent = cameraData ? cameraData.location || 'N/A' : 'N/A';
    document.getElementById("timestampCell").textContent = incidentData.timestamp;
    document.getElementById("employeeCell").textContent = incidentData.employee;
    
    const videoPathCell = document.getElementById("videoPathCell");
    videoPathCell.innerHTML = ''; 
    if (incidentData.video_path) {
        const videoPathLink = document.createElement('a');
        videoPathLink.href = incidentData.video_path;
        videoPathLink.textContent = incidentData.video_path;
        videoPathCell.appendChild(videoPathLink);
    } else {
        videoPathCell.textContent = 'N/A';
    }
}

function postIncidentData(id, video, email) {
    fetch(`http://127.0.0.1:8000/api/identify/?id=${id}&video=${video}&email=${email}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        console.log('Data posted successfully:', data);
    })
    .catch(error => {
        console.error('Error posting incident data:', error);
    });
}
