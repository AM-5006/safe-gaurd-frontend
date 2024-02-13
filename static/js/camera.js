function createAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.classList.add('alert', `alert-${type}`, 'alert-dismissible', 'fade', 'show');
    alertDiv.setAttribute('role', 'alert');
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    const timeoutDuration = 3000;
    setTimeout(() => {
        alertDiv.remove();
    }, timeoutDuration);
    return alertDiv;
}


let canvas = document.querySelector("canvas");
let ctx = canvas.getContext("2d");
let infoPoints = document.querySelector(".points-info");
let clickPoints = [];
let cam_id = null;

canvas.addEventListener("click", evt => {
    clickPoints.push([evt.offsetX, evt.offsetY]);
    drawDot(evt.offsetX, evt.offsetY);
    infoPoints.textContent = clickPoints.join(" : ")
    if (clickPoints.length >= 4) {
        drawPoly(clickPoints);
        clickPoints = []; // Reset clickPoints after drawing polygon
    }
});

const drawPoly = points => {
    ctx.lineWidth = 2;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let split = points.splice(0, 4);

    ctx.beginPath();
    ctx.moveTo(split[0][0], split[0][1]);
    for (i of split.reverse()) ctx.lineTo(i[0], i[1]);
    ctx.strokeStyle = "#FF0000";
    ctx.stroke();
}

const drawDot = (x, y) => {
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, 2 * Math.PI);
    ctx.fillStyle = "#FF0000";
    ctx.fill();
}

let biggest = 500;
let axis;
const resize = (x, y) => {
    let ratio = x > y ? x / biggest : y / biggest;
    axis = [x / ratio, y / ratio];
    canvas.height = axis[0];
    canvas.width = axis[1];
}

let rawImg = new Image();
const newImage = src => {
    rawImg.src = src;
    rawImg.onload = () => {
        canvas.style.backgroundImage = "url(" + src + ")";
        console.log(rawImg.width, rawImg.height);
        resize(rawImg.height, rawImg.width);
    };
}

document.getElementById('submitBtn').addEventListener('click', function (event) {
    event.preventDefault();
    let form = document.getElementById('myForm');
    let formCont = document.getElementById('formTab');

    let formData = new FormData(form);

    let formObject = {};
    formData.forEach((value, key) => {
        formObject[key] = value;
    });

    fetch('http://127.0.0.1:8000/api/camera/', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formObject)
    })
        .then(response => response.json())
        .then(data => {
            let responseTab = document.getElementById('responseTab');
            responseTab.classList.remove('disabled');
            responseTab.classList.add('active');
            let tab = document.getElementById('formTab');
            responseTab.classList.remove('active');
            tab.classList.add('disabled');

            cam_id = data.id;
            $('#formTabs a[href="#responseContent"]').tab('show');
            const disabledLink = document.getElementById("formTab");
            disabledLink.classList.add("disabled-link");
            let fullImageUrl = 'http://127.0.0.1:8000' + data.rtsp_frame;
            newImage(fullImageUrl)
            form.reset();
            formCont.disabled = true;
        })
        .catch(error => {
            console.error('Error:', error);
        });
});

document.getElementById('sendPolygonBtn').addEventListener('click', function () {
    let polygons = document.querySelector(".points-info").textContent;
    const poly = polygons.split(':');
    if(poly.length===4 || poly.length===0){
        fetch(`http://127.0.0.1:8000/api/camera/${cam_id}/`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            },
            body: JSON.stringify({ polygons: polygons })
        })
            .then(response => response.json())
            .then(data => {
                document.getElementById("alertContainer").appendChild(createAlert("Camera Added Successfully", "success"));
                clearTabContent(document.getElementById('responseContent'));
            })
            .catch(error => {
                document.getElementById("alertContainer").appendChild(createAlert("Error sending polygon coordinates", "danger"));
            });
        fetchDataForCards();
    }else{
        event.preventDefault();
        document.getElementById("alertContainer").appendChild(createAlert("Please select 4 coordinates only", "danger"));
    }
});


function clearTabContent(tabContent) {
    let canvas = tabContent.querySelector('canvas');
    let ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let pointsInfo = tabContent.querySelector('.points-info');
    pointsInfo.textContent = '';
}


function fetchDataForCards() {
    fetch('http://127.0.0.1:8000/api/camera/', {
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
            if (Array.isArray(data)) {
                displayCards(data);
            } else {
                console.error('Fetched data is not an array:', data);
            }
        })
        .catch(error => {
            console.error('Error fetching data for cards:', error);
        });
}


document.addEventListener("DOMContentLoaded", function () {
    fetchDataForCards();
});


function displayCards(data) {
    const container = document.getElementById("cameraCards");
    container.innerHTML = "";

    data.forEach(item => {
        const cardDiv = document.createElement("div");
        cardDiv.classList.add("col");

        const card = document.createElement("div");
        card.innerHTML = `
            <div class="card" style="width:18rem;margin:2rem;">
                <img src='http://127.0.0.1:8000${item.rtsp_frame}' style="height: 200px; object-fit: cover;"  class="card-img-top position-relative" alt="Camera Image">
                <div class="card-body">
                    <h6 class="card-text">ID: ${item.id}</h6>
                    <h5 class="card-title">${item.name}</h5>
                </div>
                <!-- Cross icon -->
                <button type="button" class="btn position-absolute bi-trash btn-sm text-danger top-0 end-0" aria-label="Close" data-bs-toggle="modal" data-bs-target="#exampleModal"></button>
            </div>
            <!-- Modal -->
            <div class="modal fade" id="exampleModal" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <h6>Are you sure you want to remove this camera? This action cannot be undone.</h6>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-primary cardDelete" data-bs-dismiss="modal">Yes</button>
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">No</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        cardDiv.appendChild(card);
        container.appendChild(cardDiv);

        card.querySelector('.cardDelete').addEventListener('click', function () {
            fetch(`http://127.0.0.1:8000/api/camera/${item.id}`, {
                method: 'DELETE',
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
                    document.getElementById("alertContainer").appendChild(createAlert("Camera deleted successfully", "success"));
                    cardDiv.remove();
                    fetchDataForCards();
                })
                .catch(error => {
                    document.getElementById("alertContainer").appendChild(createAlert("Error deleting camera", "danger"));
                });
        });
    });
}
