let canvas = document.querySelector("canvas");
let ctx = canvas.getContext("2d");
let infoPoints = document.querySelector(".points-info");
let clickPoints = [];
let cam_id = null;
let rtsp_status = false;


canvas.addEventListener("click", evt => {
    if (rtsp_status) { 
        clickPoints.push([evt.offsetX, evt.offsetY]);
        drawDot(evt.offsetX, evt.offsetY);
        infoPoints.textContent = clickPoints.join(" : ")
        if (clickPoints.length >= 4) {
            drawPoly(clickPoints);
            clickPoints = []; 
        }
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

document.getElementById('submitBtn').addEventListener('click', function () {
    event.preventDefault();
    let form = document.getElementById('myForm');
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
            let fullImageUrl = `http://127.0.0.1:8000/${data.rtsp_frame}`;
            rtsp_status = data.rtsp_status;
            form.reset();
            newImage(fullImageUrl)
        })
        .catch(error => {
            console.error('Error:', error);
        });
});

document.getElementById('sendPolygonBtn').addEventListener('click', function () {
    event.preventDefault();
    let polygons = document.querySelector(".points-info").textContent;
    let polygon = polygons.split(':').length;
    if(polygon===4 || polygons===0){
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
                // add bootstrap alert message succes 
                // modal not closing 
                $('#myModal').modal('hide');
                clearTabContent(document.getElementById('responseContent'));
            })
            .catch(error => {
                console.error('Error sending polygon coordinates:', error);
            });
    }else{
        //add bootstrap alert message 
        console.log('Please select 4 points only');
    }
});

function clearTabContent(tabContent) {
    let canvas = tabContent.querySelector('canvas');
    let ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let pointsInfo = tabContent.querySelector('.points-info');
    pointsInfo.textContent = '';
}

