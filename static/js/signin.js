document.querySelector('.btn.btn-primary').addEventListener('click', function (event) {
    event.preventDefault(); // Prevent the form from submitting normally

    let username = document.getElementById('floatingInput').value;
    let password = document.getElementById('floatingPassword').value;

    const data = {
        username: username,
        password: password
    };

    fetch('http://127.0.0.1:8000/api/signin/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
        .then(response => response.json())
        .then(data => {
            let accessToken = data.access;
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('User', username);
            window.location.href = "http://127.0.0.1:5500/overview.html"
        })
        .catch((error) => {
            console.error('Error:', error);
        });
});

