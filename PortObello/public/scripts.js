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

// // Fetches data from COUNTRY and displays it.
// async function fetchAndDisplayCountry() {
//     const tableElement = document.getElementById('country');
//     const tableBody = tableElement.querySelector('tbody');
//
//     const response = await fetch('/country', {
//         method: 'GET'
//     });
//
//     const responseData = await response.json();
//     const countryContent = responseData.data;
//
//     // Always clear old, already fetched data before new fetching process.
//     if (tableBody) {
//         tableBody.innerHTML = '';
//     }
//
//     countryContent.forEach(country => {
//         const row = tableBody.insertRow();
//         Object.values(country).forEach((field, index) => {
//             const cell = row.insertCell(index);
//             cell.textContent = field;
//         });
//     });
// }

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
        const messageElement = document.getElementById('resetResultMsg');
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


// ---------------------------------------------------------------
// Initializes the webpage functionalities.
// Add or remove event listeners based on the desired functionalities.
// window.onload = function() {
//     checkDbConnection();
//     fetchTableData();
//     document.getElementById("resetCountry").addEventListener("click", resetCountry);
//     document.getElementById("insertCountry").addEventListener("submit", insertCountry);
//     document.getElementById("updateNameCountry").addEventListener("submit", updateNameCountry);
//     document.getElementById("countCountry").addEventListener("click", countCountry);
// };
window.onload = function() {
    console.log('Page loaded, initializing...');
    checkDbConnection();
    fetchAndDisplayCountry();  // Initial fetch

    // Add event listeners
    document.getElementById("resetCountry").addEventListener("click", async () => {
        await resetCountry();
        await fetchAndDisplayCountry();  // Refresh table after reset
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
}
