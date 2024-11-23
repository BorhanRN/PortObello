/*
 * These functions below are for various webpage functionalities.
 * Each function serves to process data on the frontend:
 *      - Before sending requests to the backend.
 *      - After receiving responses from the backend.
 *
 * To tailor them to your specific needs,
 * adjust or expand these functions to match both your
 *   backend endpoints
 * and
 *   HTML structure.
 *
 */


// This function checks the database connection and updates its status on the frontend.
async function checkDbConnection() {
    const statusElem = document.getElementById('dbStatus');
    const loadingGifElem = document.getElementById('loadingGif');

    const response = await fetch('/check-db-connection', {
        method: "GET"
    });

    // Hide the loading GIF once the response is received.
    loadingGifElem.style.display = 'none';
    // Display the statusElem's text in the placeholder.
    statusElem.style.display = 'inline';

    response.text()
        .then((text) => {
            statusElem.textContent = text;
        })
        .catch((error) => {
            statusElem.textContent = 'connection timed out';  // Adjust error handling if required.
        });
}

// Fetches data from COUNTRY and displays it. CL1
async function fetchAndDisplayCountry() {
    try {
        console.log('Fetching country data...');
        const response = await fetch('/country', { method: 'GET' });
        console.log('Response status:', response.status);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const responseData = await response.json();
        console.log('Response JSON:', responseData);

        const tableElement = document.getElementById('country');
        if (!tableElement) throw new Error('Table element with id "country" not found');

        const tableBody = tableElement.querySelector('tbody');
        if (!tableBody) throw new Error('No <tbody> found in table');

        // Clear old content
        tableBody.innerHTML = '';

        if (!responseData.data || !Array.isArray(responseData.data)) {
            throw new Error('Data format error: data is not an array');
        }

        responseData.data.forEach(country => {
            const row = tableBody.insertRow();
            const columns = ['NAME', 'POPULATION', 'GOVERNMENT', 'GDP', 'PORTADDRESS'];
            columns.forEach(col => {
                const cell = row.insertCell();
                cell.textContent = country[col] || 'N/A';
            });
        });

        console.log('Table populated successfully');
    } catch (error) {
        console.error('Error in fetchAndDisplayCountry:', error);
    }

}

// This function resets or initializes COUNTRY.
async function resetCountry() {
    const response = await fetch("/initiate-country", {
        method: 'POST'
    });
    const responseData = await response.json();

    if (responseData.success) {
        const messageElement = document.getElementById('resetCountryResultMsg');
        messageElement.textContent = "country initiated successfully!";
        fetchTableData();
    } else {
        alert("Error initiating table!");
    }
}

// Inserts new records into COUNTRY.
async function insertCountry(event) {
    event.preventDefault();

    const name = document.getElementById('insertCountryName').value;
    const population = document.getElementById('insertCountryPopulation').value;
    const government = document.getElementById('insertCountryGovernment').value;
    const gdp = document.getElementById('insertCountryGDP').value;
    const portaddress = document.getElementById('insertCountryPortAddress').value;

    const response = await fetch('/insert-country', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: name,
            population: population,
            government: government,
            gdp: gdp,
            portaddress: portaddress
        })
    });

    const responseData = await response.json();
    const messageElement = document.getElementById('insertResultMsg');

    if (responseData.success) {
        messageElement.textContent = "Data inserted successfully!";
        fetchTableData();
    } else {
        messageElement.textContent = "Error inserting data!";
    }
}

// Updates names in country.
async function updateNameCountry(event) {
    event.preventDefault();

    const oldNameValue = document.getElementById('updateOldName').value;
    const newNameValue = document.getElementById('updateNewName').value;

    const response = await fetch('/update-name-country', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            oldName: oldNameValue,
            newName: newNameValue
        })
    });

    const responseData = await response.json();
    const messageElement = document.getElementById('updateNameResultMsg');

    if (responseData.success) {
        messageElement.textContent = "Name updated successfully!";
        fetchTableData();
    } else {
        messageElement.textContent = "Error updating name!";
    }
}

// Counts rows in country.
// Modify the function accordingly if using different aggregate functions or procedures.
async function countCountry() {
    const response = await fetch("/count-country", {
        method: 'GET'
    });

    const responseData = await response.json();
    const messageElement = document.getElementById('countResultMsg');

    if (responseData.success) {
        const tupleCount = responseData.count;
        messageElement.textContent = `The number of tuples in country: ${tupleCount}`;
    } else {
        alert("Error in count country!");
    }
}

// Fetches data from PORT and displays it. CL1
async function fetchAndDisplayPort() {
    try {
        console.log('Fetching port data...');
        const response = await fetch('/port', { method: 'GET' });
        console.log('Response status:', response.status);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const responseData = await response.json();
        console.log('Response JSON:', responseData);

        const tableElement = document.getElementById('port');
        if (!tableElement) throw new Error('Table element with id "port" not found');

        const tableBody = tableElement.querySelector('tbody');
        if (!tableBody) throw new Error('No <tbody> found in table');

        // Clear old content
        tableBody.innerHTML = '';

        if (!responseData.data || !Array.isArray(responseData.data)) {
            throw new Error('Data format error: data is not an array');
        }

        responseData.data.forEach(port => {
            const row = tableBody.insertRow();
            const columns = ['PORTADDRESS', 'NUMWORKERS', 'DOCKEDSHIPS', 'COUNTRYNAME'];
            columns.forEach(col => {
                const cell = row.insertCell();
                cell.textContent = port[col] || 'N/A';
            });
        });

        console.log('Table populated successfully');
    } catch (error) {
        console.error('Error in fetchAndDisplayCountry:', error);
    }

}

// This function resets or initializes PORT.
async function resetPort() {
    const response = await fetch("/initiate-port", {
        method: 'POST'
    });
    const responseData = await response.json();

    if (responseData.success) {
        const messageElement = document.getElementById('resetPortResultMsg');
        messageElement.textContent = "port initiated successfully!";
        fetchTableData();
    } else {
        alert("Error initiating table!");
    }
}

// Fetches data from WAREHOUSE and displays it. CL1
async function fetchAndDisplayWarehouse() {
    try {
        console.log('Fetching warehouse data...');
        const response = await fetch('/warehouse', { method: 'GET' });
        console.log('Response status:', response.status);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const responseData = await response.json();
        console.log('Response JSON:', responseData);

        const tableElement = document.getElementById('warehouse');
        if (!tableElement) throw new Error('Table element with id "warehouse" not found');

        const tableBody = tableElement.querySelector('tbody');
        if (!tableBody) throw new Error('No <tbody> found in table');

        // Clear old content
        tableBody.innerHTML = '';

        if (!responseData.data || !Array.isArray(responseData.data)) {
            throw new Error('Data format error: data is not an array');
        }

        responseData.data.forEach(warehouse => {
            const row = tableBody.insertRow();
            const columns = ['PORTADDRESS', 'SECTION', 'NUMCONTAINERS', 'CAPACITY'];
            columns.forEach(col => {
                const cell = row.insertCell();
                cell.textContent = warehouse[col] || 'N/A';
            });
        });

        console.log('Table populated successfully');
    } catch (error) {
        console.error('Error in fetchAndDisplayWarehouse:', error);
    }

}

// This function resets or initializes WAREHOUSE.
async function resetWarehouse() {
    const response = await fetch("/initiate-warehouse", {
        method: 'POST'
    });
    const responseData = await response.json();

    if (responseData.success) {
        const messageElement = document.getElementById('resetWarehouseResultMsg');
        messageElement.textContent = "warehouse initiated successfully!";
        fetchTableData();
    } else {
        alert("Error initiating table!");
    }
}

// Fetches data from PORT and displays it. CL1
async function fetchAndDisplayHomeCountry() {
    try {
        console.log('Fetching homecountry data...');
        const response = await fetch('/homecountry', { method: 'GET' });
        console.log('Response status:', response.status);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const responseData = await response.json();
        console.log('Response JSON:', responseData);

        const tableElement = document.getElementById('homecountry');
        if (!tableElement) throw new Error('Table element with id "homecountry" not found');

        const tableBody = tableElement.querySelector('tbody');
        if (!tableBody) throw new Error('No <tbody> found in table');

        // Clear old content
        tableBody.innerHTML = '';

        if (!responseData.data || !Array.isArray(responseData.data)) {
            throw new Error('Data format error: data is not an array');
        }

        responseData.data.forEach(homecountry => {
            const row = tableBody.insertRow();
            const columns = ['NAME', 'POPULATION', 'GDP', 'GOVERNMENT', 'DOCKINGFEE'];
            columns.forEach(col => {
                const cell = row.insertCell();
                cell.textContent = homecountry[col] || 'N/A';
            });
        });

        console.log('Table populated successfully');
    } catch (error) {
        console.error('Error in fetchAndDisplayHomeCountry:', error);
    }

}

// This function resets or initializes PORT.
async function resetHomeCountry() {
    const response = await fetch("/initiate-homecountry", {
        method: 'POST'
    });
    const responseData = await response.json();

    if (responseData.success) {
        const messageElement = document.getElementById('resetHomeCountryResultMsg');
        messageElement.textContent = "homecountry initiated successfully!";
        fetchTableData();
    } else {
        alert("Error initiating table!");
    }
}


// Fetches data from FOREIGNCOUNTRY and displays it. CL1
async function fetchAndDisplayForeignCountry() {
    try {
        console.log('Fetching foreigncountry data...');
        const response = await fetch('/foreigncountry', { method: 'GET' });
        console.log('Response status:', response.status);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const responseData = await response.json();
        console.log('Response JSON:', responseData);

        const tableElement = document.getElementById('foreigncountry');
        if (!tableElement) throw new Error('Table element with id "foreigncountry" not found');

        const tableBody = tableElement.querySelector('tbody');
        if (!tableBody) throw new Error('No <tbody> found in table');

        // Clear old content
        tableBody.innerHTML = '';

        if (!responseData.data || !Array.isArray(responseData.data)) {
            throw new Error('Data format error: data is not an array');
        }

        responseData.data.forEach(foreigncountry => {
            const row = tableBody.insertRow();
            const columns = ['NAME', 'POPULATION', 'GDP', 'GOVERNMENT', 'DOCKINGFEE'];
            columns.forEach(col => {
                const cell = row.insertCell();
                cell.textContent = foreigncountry[col] || 'N/A';
            });
        });

        console.log('Table populated successfully');
    } catch (error) {
        console.error('Error in fetchAndDisplayHomeCountry:', error);
    }

}

// This function resets or initializes FOREIGNCOUNTRY.
async function resetForeignCountry() {
    const response = await fetch("/initiate-foreigncountry", {
        method: 'POST'
    });
    const responseData = await response.json();

    if (responseData.success) {
        const messageElement = document.getElementById('resetForeignCountryResultMsg');
        messageElement.textContent = "foreigncountry initiated successfully!";
        fetchTableData();
    } else {
        alert("Error initiating table!");
    }
}



// ---------------------------------------------------------------
// Initializes the webpage functionalities.
// Add or remove event listeners based on the desired functionalities.
window.onload = function() {
    console.log('Page loaded, initializing...');
    checkDbConnection();

    fetchAndDisplayCountry();  // Initial fetches
    fetchAndDisplayPort();
    fetchAndDisplayWarehouse();
    fetchAndDisplayHomeCountry();
    fetchAndDisplayForeignCountry();

    // Add event listeners
    document.getElementById("resetCountry").addEventListener("click", async () => {
        await resetCountry();
        await fetchAndDisplayCountry();  // Refresh table after reset
    });
    document.getElementById("resetPort").addEventListener("click", async () => {
        await resetPort();
        await fetchAndDisplayPort();  // Refresh table after reset
    });
    document.getElementById("resetWarehouse").addEventListener("click", async () => {
        await resetWarehouse();
        await fetchAndDisplayWarehouse();  // Refresh table after reset
    });
    document.getElementById("resetHomeCountry").addEventListener("click", async () => {
        await resetHomeCountry();
        await fetchAndDisplayHomeCountry();  // Refresh table after reset
    });
    document.getElementById("resetForeignCountry").addEventListener("click", async () => {
        await resetForeignCountry();
        await fetchAndDisplayForeignCountry();  // Refresh table after reset
    });


    document.getElementById("insertCountry").addEventListener("submit", async (e) => {
        await insertCountry(e);
        await fetchAndDisplayCountry();  // Refresh table after insert
    });
    document.getElementById("updateNameCountry").addEventListener("submit", async (e) => {
        await updateNameCountry(e);
        await fetchAndDisplayCountry();  // Refresh table after update
    });
    document.getElementById("countCountry").addEventListener("click", countCountry);
}

// General function to refresh the displayed table data.
// You can invoke this after any table-modifying operation to keep consistency.
function fetchTableData() {
    fetchAndDisplayCountry();
    fetchAndDisplayWarehouse();
    fetchAndDisplayHomeCountry();
    fetchAndDisplayForeignCountry();
}
