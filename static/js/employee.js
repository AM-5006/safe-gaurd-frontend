//function to parse csv and xlsx files
function parseFile() {
    const fileInput = document.getElementById('csvFileInput');
    const file = fileInput.files[0];
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
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
                const workbook = XLSX.read(result, {type: 'binary'});
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const rows = XLSX.utils.sheet_to_json(sheet, {header: 1});
                const firstRow = XLSX.utils.sheet_to_json(sheet, {header: 1})[0];
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
                console.error('Unsupported file format.');
            }
        };
        reader.readAsBinaryString(file);
    } else {
        console.error('No file selected.');
    }
}

//make post request to add employee
function makePostRequest(data) {
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
        console.log('Data posted successfully:', data);
        const fileInput = document.getElementById('csvFileInput');
        fileInput.value = '';
        $('#exampleModalToggle').modal('hide');
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
        console.log('Data posted successfully:', data);
        document.getElementById('exampleInputempid').value = '';
        document.getElementById('exampleInputfname').value = '';
        document.getElementById('exampleInputlname').value = '';
        document.getElementById('exampleInputphone').value = '';
        $('#exampleModalToggle2').modal('hide');
    })
    .catch(error => {
        console.error('Error posting data:', error);
    });
});

