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

//function to parse csv and xlsx files
function parseFile() {
    const fileInput = document.getElementById('csvFileInput');
    const file = fileInput.files[0];

    if (file) {
        const reader = new FileReader();
        reader.onload = function (event) {
            const result = event.target.result;
            const extension = file.name.split('.').pop().toLowerCase();

            if (extension === 'csv') {
                const lines = result.split('\n');
                const headers = lines[0].trim().split(',').map(header => header.replace(/^\W+/, ''));
                const requiredColumns = ['emp_id', 'first_name', 'last_name', 'phone'];
                const missingColumns = requiredColumns.filter(column => !headers.includes(column));

                if (missingColumns.length === 0) {
                    const data = [];
                    lines.slice(1).forEach(line => {
                        const rowData = {};
                        line.trim().split(',').forEach((value, index) => {
                            rowData[headers[index]] = value;
                        });
                        data.push(rowData);
                    });
                    data.pop();
                    makePostRequest(data);
                } else {
                    console.log('File is missing the following required columns: ' + missingColumns.join(', '));
                }
            } else if (extension === 'xlsx') {
                const workbook = XLSX.read(result, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
                const firstRow = XLSX.utils.sheet_to_json(sheet, { header: 1 })[0];
                const requiredColumns = ['emp_id', 'first_name', 'last_name', 'phone'];
                const missingColumns = requiredColumns.filter(column => !firstRow.includes(column));

                if (missingColumns.length === 0) {
                    const data = [];
                    rows.slice(1).forEach(row => {
                        const rowData = {};
                        rows[0].forEach((value, index) => {
                            rowData[firstRow[index]] = row[index];
                        });
                        data.push(rowData);
                    });
                    makePostRequest(data);
                } else {
                    console.log('File is missing the following required columns: ' + missingColumns.join(', '));
                }
            } else {
                document.getElementById("alertContainer").appendChild(createAlert("Unsupported File Format", "Danger"));
            }
        };
        reader.readAsBinaryString(file);
    } else {
        document.getElementById("alertContainer").appendChild(createAlert("Please Select a File", "danger"));
    }
}

//make post request to add employee
function makePostRequest(data) {
    console.log(data);
    fetch('http://127.0.0.1:8000/api/employee/', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            document.getElementById("alertContainer").appendChild(createAlert("Employee Added Successfully", "success"));
            const fileInput = document.getElementById('csvFileInput');
            fileInput.value = '';
            $('#exampleModalToggle').modal('hide');
            fetchTable();
        })
        .catch(error => {
            console.error('Error posting data:', error);
        });
}

//add employee through form
document.querySelector('#employee-form').addEventListener('click', function (event) {
    event.preventDefault(); // Prevent the form from submitting normally

    const data = {
        emp_id: document.getElementById('exampleInputempid').value,
        first_name: document.getElementById('exampleInputfname').value,
        last_name: document.getElementById('exampleInputlname').value,
        phone: document.getElementById('exampleInputphone').value
    };
    fetch('http://127.0.0.1:8000/api/employee/', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            document.getElementById("alertContainer").appendChild(createAlert("Employee Added Successfully", "success"));
            console.log(data);
            document.getElementById('exampleInputempid').value = '';
            document.getElementById('exampleInputfname').value = '';
            document.getElementById('exampleInputlname').value = '';
            document.getElementById('exampleInputphone').value = '';
            $('#exampleModalToggle2').modal('hide');
            fetchTable();
        })
        .catch(error => {
            console.error('Error posting data:', error);
        });
});

function fetchTable(pageNumber = 1) {
    fetch(`http://127.0.0.1:8000/api/employee/?page=${pageNumber}`, {
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
            console.log(data);
            const tbody = document.querySelector('.table tbody');
            tbody.innerHTML = '';
            if (data && data.length > 0) {
                data.forEach(item => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                    <td>${item.emp_id}</td>
                    <td>${item.first_name}</td>
                    <td>${item.last_name}</td>
                    <td>${item.phone}</td>
                    <td><i type="button" class="fa fa-user-edit" id="employeeEdit" onclick="editEmployee('${item.emp_id}', '${item.first_name}', '${item.last_name}', '${item.phone}')" data-bs-toggle="modal" data-bs-target="#exampleModalEdit"></i></td>
                    <td><i type="button" class="fa fa-trash text-danger" onclick="deleteEmployee(${item.emp_id})" id="employeeDelete"></i></td>
                `;
                    tbody.appendChild(row);
                });

                // Check if there are more pages available
                if (data.length === 10) {
                    createPagination(pageNumber + 1);
                }
            } else {
                const row = document.createElement('tr');
                row.innerHTML = '<td colspan="6"><h5 class="text-center">No Employees Were Found</h5></td>';
                tbody.appendChild(row);
            }
        })
        .catch(error => {
            console.error('Error fetching data:', error);
        });
}




//Function to Delete Employee
function deleteEmployee(employeeId) {
    fetch(`http://127.0.0.1:8000/api/employee/${employeeId}/`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            'Content-Type': 'application/json'
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to delete employee');
            }
            document.getElementById("alertContainer").appendChild(createAlert("Employee Deleted Successfully", "success"));
            fetchTable();
        })
        .catch(error => {
            console.error('Error deleting employee:', error);
        });
}
fetchTable();

// function to edit employee
function editEmployee(emp_id, first_name, last_name, phone) {
    document.getElementById('editempid').value = emp_id;
    document.getElementById('editfname').value = first_name;
    document.getElementById('editlname').value = last_name;
    document.getElementById('editphone').value = phone;
    document.getElementById('edit-form').addEventListener('click', function (event) {
        event.preventDefault();
        const data = {
            emp_id: emp_id.toString(),
            first_name: document.getElementById('editfname').value,
            last_name: document.getElementById('editlname').value,
            phone: document.getElementById('editphone').value
        };
        fetch(`http://127.0.0.1:8000/api/employee/${emp_id}/`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                document.getElementById("alertContainer").appendChild(createAlert("Employee Updated Successfully", "success"));
                console.log(data);
                document.getElementById('editfname').value = '';
                document.getElementById('editlname').value = '';
                document.getElementById('editphone').value = '';
                fetchTable();
            })
            .catch(error => {
                console.error('Error updating employee details:', error);
            });
    });
}

// create pagination
function createPagination(totalPages) {
    const paginationContainer = document.getElementById("paginationContainer");
    paginationContainer.innerHTML = "";

    const nav = document.createElement("nav");
    nav.setAttribute("aria-label", "Page navigation example");

    const ul = document.createElement("ul");
    ul.classList.add("pagination", "justify-content-center");

    for (let i = 1; i <= totalPages; i++) {
        const pageLi = document.createElement("li");
        pageLi.classList.add("page-item");

        const pageLink = document.createElement("button");
        pageLink.classList.add("page-link");
        pageLink.setAttribute("type", "button");
        pageLink.textContent = "Page " + i;

        pageLink.addEventListener("click", function () {
            fetchTable(i);
            updateActivePage(i);
        });

        if (i === 1) {
            pageLi.classList.add("active");
        }

        pageLi.appendChild(pageLink);
        ul.appendChild(pageLi);
    }

    nav.appendChild(ul);
    paginationContainer.appendChild(nav);
}

function updateActivePage(newPage) {
    const currentPageLink = document.querySelector(".pagination .page-item.active .page-link");
    if (currentPageLink) {
        currentPageLink.parentElement.classList.remove("active");
    }
    const newPageLink = document.querySelector(`.pagination .page-item:nth-child(${newPage}) .page-link`);
    if (newPageLink) {
        newPageLink.parentElement.classList.add("active");
    }
}

function getCurrentPage() {
    const activePage = document.querySelector(".pagination .page-item.active .page-link");
    return activePage ? parseInt(activePage.textContent) : 1;
}
