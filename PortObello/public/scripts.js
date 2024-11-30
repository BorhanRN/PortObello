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

// This function resets or initiates ALL.
async function initiateAll() {
    const response = await fetch("/initiate-all", {
        method: 'POST'
    });
    const responseData = await response.json();

    if (responseData.success) {
        const messageElement = document.getElementById('initiateAllResultMsg');
        messageElement.textContent = "all initiated successfully!";
    } else {
        alert("Error initiating table!");
    }
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

async function updateCountry(event) {
    event.preventDefault();

    const nameValue = document.getElementById('updateName').value;
    const populationValue = document.getElementById('updatePopulation').value;
    const governmentValue = document.getElementById('updateGovernment').value;
    const portAddressValue = document.getElementById('updatePortAddress').value;
    const GDPValue = document.getElementById('updateGDP').value;

    const response = await fetch('/update-country', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            cname: nameValue,
            population: populationValue,
            government: governmentValue,
            portaddress: portAddressValue,
            gdp: GDPValue
        })
    });

    const responseData = await response.json();
    const messageElement = document.getElementById('updateResultMsg');

    if (responseData.success) {
        messageElement.textContent = "Country updated successfully!";
        fetchTableData();
    } else {
        messageElement.textContent = "Error updating country!";
    }
}

//Deletes a port
async function deletePortCall(event) {
    event.preventDefault();
    const portToDelete = document.getElementById('portAddress').value; // PROBLEMATIC, causing null error on f12 console

    const response = await fetch( '/delete-port', {
        method: 'POST',
            headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            addy: portToDelete,
        })
    });

    const responseData = await response.json();
    const messageElement = document.getElementById('deletePortResultsMsg');

    if (responseData.success) {
        messageElement.textContent = "Port deleted successfully!";
        fetchTableData();
    } else {
        messageElement.textContent = "Error deleting port!";
    }
}

//finds max average of container value
async function maxAverage(event) {
    event.preventDefault();
    try {
        const response = await fetch('/max-ship-average', {
            method: 'GET',
        });

        if (!response.ok) {
            throw new Error("Failed to fetch max average data.");
        }

        const responseData = await response.json();
        const messageElement = document.getElementById('getMaxMessage');

        if (responseData.shipName && responseData.maxAvg !== undefined) {
            messageElement.textContent = `${responseData.shipName} is the ship with the highest average good value, being $${responseData.maxAvg}`;
            fetchTableData(); // Ensure this function exists to update table data on the page
        } else {
            messageElement.textContent = "Error finding the ship!";
        }
    } catch (error) {
        console.error('Error in maxAverage:', error);
    }
}

// processes numShips with HTML input
async function numShip(event) {
    event.preventDefault();

    const min = document.getElementById('minNumb').value;
    const max = document.getElementById('maxNumb').value;

    try {
        const response = await fetch('/port-num-ship', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                min: min,
                max: max,
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const responseData = await response.json();
        const tableBody = document.getElementById('populatedPorts').querySelector('tbody');

        // Clear old results
        tableBody.innerHTML = '';

        if (responseData.success && Array.isArray(responseData.data)) {
            responseData.data.forEach(ship => {
                const row = tableBody.insertRow();
                ['PORTLOCATION', 'NUMOFSHIPS'].forEach(attr => {
                    const cell = row.insertCell();
                    cell.textContent = ship[attr] || 'N/A';
                });
            });
        } else {
            const row = tableBody.insertRow();
            const cell = row.insertCell();
            cell.colSpan = 6;
            cell.textContent = 'No results found';
        }
    } catch (error) {
        console.error('Error running populated ports query:', error);
    }
}

// Sorts countries countries based on GDP
async function countCountry() {
    const messageElement = document.getElementById('countriesByGDPMessage');
    const tableElement = document.getElementById('countriesByGDPTable');
    const tableBody = tableElement.querySelector('tbody');

    try {
        const response = await fetch('/count-country', { method: 'GET' });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const responseData = await response.json();

        if (responseData.success && Array.isArray(responseData.data)) {
            tableBody.innerHTML = ''; // Clear old content

            responseData.data.forEach(row => {
                const tableRow = tableBody.insertRow();
                const gdpRangeCell = tableRow.insertCell();
                gdpRangeCell.textContent = row.GDPRANGE;

                const countCell = tableRow.insertCell();
                countCell.textContent = row.COUNTRYCOUNT;
            });

            tableElement.style.display = 'table';
            messageElement.textContent = 'Data loaded successfully!';
            messageElement.style.color = 'green';
        } else {
            throw new Error('Unexpected response format or data');
        }
    } catch (error) {
        console.error('Error fetching countries by GDP range:', error);
        messageElement.textContent = 'Failed to load data.';
        messageElement.style.color = 'red';
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
            const columns = ['PORTADDRESS', 'WAREHOUSESECTION', 'NUMCONTAINERS', 'CAPACITY'];
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
            const columns = ['NAME', 'POPULATION', 'GDP', 'GOVERNMENT', 'PORTADDRESS'];
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

// Adds new tuple in Home Country table
async function insertHomeCountry(event) {
    event.preventDefault();

    const name = document.getElementById('insertHomeCountryName').value;
    const population = document.getElementById('insertHomeCountryPopulation').value;
    const government = document.getElementById('insertHomeCountryGovernment').value;
    const gdp = document.getElementById('insertHomeCountryGDP').value;
    const portaddress = document.getElementById('insertHomeCountryPortAddress').value;

    const response = await fetch('/insert-homecountry', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            name: name,
            population: population,
            government: government,
            gdp: gdp,
            portaddress: portaddress,
        }),
    });

    const responseData = await response.json();
    const messageElement = document.getElementById('insertHomeResultMsg');

    if (responseData.success) {
        messageElement.textContent = "Data inserted successfully!";
        messageElement.style.color = "green";
        fetchTableData(); // Ensure this function updates the "homecountry" table
    } else {
        messageElement.textContent = "Error inserting data!";
        messageElement.style.color = "red";
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
            const columns = ['NAME', 'POPULATION', 'GDP', 'GOVERNMENT', 'DOCKINGFEE', 'PORTADDRESS'];
            columns.forEach(col => {
                const cell = row.insertCell();
                cell.textContent = foreigncountry[col] || 'N/A';
            });
        });

        console.log('Table populated successfully');
    } catch (error) {
        console.error('Error in fetchAndDisplayForeignCountry:', error);
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


// Fetches data from TARIFF and displays it. CL1
async function fetchAndDisplayTariff() {
    try {
        console.log('Fetching tariff data...');
        const response = await fetch('/tariff', { method: 'GET' });
        console.log('Response status:', response.status);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const responseData = await response.json();
        console.log('Response JSON:', responseData);

        const tableElement = document.getElementById('tariff');
        if (!tableElement) throw new Error('Table element with id "tariff" not found');

        const tableBody = tableElement.querySelector('tbody');
        if (!tableBody) throw new Error('No <tbody> found in table');

        // Clear old content
        tableBody.innerHTML = '';

        if (!responseData.data || !Array.isArray(responseData.data)) {
            throw new Error('Data format error: data is not an array');
        }

        responseData.data.forEach(tariff => {
            const row = tableBody.insertRow();
            const columns = ['TRADEAGREEMENT', 'TARIFFRATE', 'HOMENAME', 'FOREIGNNAME', 'ENACTMENTDATE', 'AFFECTEDGOODS'];
            columns.forEach(col => {
                const cell = row.insertCell();
                cell.textContent = tariff[col] || 'N/A';
            });
        });

        console.log('Table populated successfully');
    } catch (error) {
        console.error('Error in fetchAndDisplayTariff:', error);
    }

}

// This function resets or initializes TARIFF.
async function resetTariff() {
    const response = await fetch("/initiate-tariff", {
        method: 'POST'
    });
    const responseData = await response.json();

    if (responseData.success) {
        const messageElement = document.getElementById('resetTariffResultMsg');
        messageElement.textContent = "tariff initiated successfully!";
        fetchTableData();
    } else {
        alert("Error initiating table!");
    }
}

// Fetches data from SHIPPINGROUTE and displays it. CL1
async function fetchAndDisplayShippingRoute() {
    try {
        console.log('Fetching shippingroute data...');
        const response = await fetch('/shippingroute', { method: 'GET' });
        console.log('Response status:', response.status);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const responseData = await response.json();
        console.log('Response JSON:', responseData);

        const tableElement = document.getElementById('shippingroute');
        if (!tableElement) throw new Error('Table element with id "shippingroute" not found');

        const tableBody = tableElement.querySelector('tbody');
        if (!tableBody) throw new Error('No <tbody> found in table');

        // Clear old content
        tableBody.innerHTML = '';

        if (!responseData.data || !Array.isArray(responseData.data)) {
            throw new Error('Data format error: data is not an array');
        }

        responseData.data.forEach(shippingroute => {
            const row = tableBody.insertRow();
            const columns = ['NAME', 'LENGTH', 'ORIGINCOUNTRYNAME', 'TERMINALCOUNTRYNAME', 'ANNUALVOLUMEOFGOODS'];
            columns.forEach(col => {
                const cell = row.insertCell();
                cell.textContent = shippingroute[col] || 'N/A';
            });
        });

        console.log('Table populated successfully');
    } catch (error) {
        console.error('Error in fetchAndDisplayShippingRoute:', error);
    }

}

// This function resets or initializes SHIPPINGROUTE.
async function resetShippingRoute() {
    const response = await fetch("/initiate-shippingroute", {
        method: 'POST'
    });
    const responseData = await response.json();

    if (responseData.success) {
        const messageElement = document.getElementById('resetShippingRouteResultMsg');
        messageElement.textContent = "shippingroute initiated successfully!";
        fetchTableData();
    } else {
        alert("Error initiating table!");
    }
}

// Fetches data from SHIP and displays it. CL1
async function fetchAndDisplayShip() {
    try {
        console.log('Fetching ship data...');
        const response = await fetch('/ship', { method: 'GET' });
        console.log('Response status:', response.status);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const responseData = await response.json();
        console.log('Response JSON:', responseData);

        const tableElement = document.getElementById('ship');
        if (!tableElement) throw new Error('Table element with id "ship" not found');

        const tableBody = tableElement.querySelector('tbody');
        if (!tableBody) throw new Error('No <tbody> found in table');

        // Clear old content
        tableBody.innerHTML = '';

        if (!responseData.data || !Array.isArray(responseData.data)) {
            throw new Error('Data format error: data is not an array');
        }

        responseData.data.forEach(ship => {
            const row = tableBody.insertRow();
            const columns = ['OWNER', 'SHIPNAME', 'SHIPPINGROUTENAME', 'DOCKEDATPORTADDRESS', 'SHIPSIZE', 'CAPACITY'];
            columns.forEach(col => {
                const cell = row.insertCell();
                cell.textContent = ship[col] || 'N/A';
            });
        });

        console.log('Table populated successfully');
    } catch (error) {
        console.error('Error in fetchAndDisplayShip:', error);
    }

}

// This function resets or initializes SHIP.
async function resetShip() {
    const response = await fetch("/initiate-ship", {
        method: 'POST'
    });
    const responseData = await response.json();

    if (responseData.success) {
        const messageElement = document.getElementById('resetShipResultMsg');
        messageElement.textContent = "ship initiated successfully!";
        fetchTableData();
    } else {
        alert("Error initiating table!");
    }
}


// Fetches data from COMPANY and displays it. CL1
async function fetchAndDisplayCompany() {
    try {
        console.log('Fetching ship data...');
        const response = await fetch('/company', { method: 'GET' });
        console.log('Response status:', response.status);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const responseData = await response.json();
        console.log('Response JSON:', responseData);

        const tableElement = document.getElementById('company');
        if (!tableElement) throw new Error('Table element with id "company" not found');

        const tableBody = tableElement.querySelector('tbody');
        if (!tableBody) throw new Error('No <tbody> found in table');

        // Clear old content
        tableBody.innerHTML = '';

        if (!responseData.data || !Array.isArray(responseData.data)) {
            throw new Error('Data format error: data is not an array');
        }

        responseData.data.forEach(company => {
            const row = tableBody.insertRow();
            const columns = ['CEO', 'NAME', 'INDUSTRY', 'YEARLYREVENUE', 'COUNTRYNAME'];
            columns.forEach(col => {
                const cell = row.insertCell();
                cell.textContent = company[col] || 'N/A';
            });
        });

        console.log('Table populated successfully');
    } catch (error) {
        console.error('Error in fetchAndDisplayCompany:', error);
    }

}

// This function resets or initializes COMPANY.
async function resetCompany() {
    const response = await fetch("/initiate-company", {
        method: 'POST'
    });
    const responseData = await response.json();

    if (responseData.success) {
        const messageElement = document.getElementById('resetCompanyResultMsg');
        messageElement.textContent = "company initiated successfully!";
        fetchTableData();
    } else {
        alert("Error initiating table!");
    }
}


// Fetches data from SHIPMENTCONTAINER and displays it. CL1
async function fetchAndDisplayShipmentContainer() {
    try {
        console.log('Fetching shipmentcontainer data...');
        const response = await fetch('/shipmentcontainer', { method: 'GET' });
        console.log('Response status:', response.status);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const responseData = await response.json();
        console.log('Response JSON:', responseData);

        const tableElement = document.getElementById('shipmentcontainer');
        if (!tableElement) throw new Error('Table element with id "shipmentcontainer" not found');

        const tableBody = tableElement.querySelector('tbody');
        if (!tableBody) throw new Error('No <tbody> found in table');

        // Clear old content
        tableBody.innerHTML = '';

        if (!responseData.data || !Array.isArray(responseData.data)) {
            throw new Error('Data format error: data is not an array');
        }

        responseData.data.forEach(shipmentcontainer => {
            const row = tableBody.insertRow();
            const columns = ['SHIPOWNER', 'SHIPNAME', 'GOODTYPE', 'GOODVALUE', 'CONTAINERSIZE', 'WEIGHT', 'TRACKINGNUMBER', 'TRADEAGREEMENT', 'COMPANYNAME', 'COMPANYCEO', 'PORTADDRESS', 'WAREHOUSESECTION'];
            columns.forEach(col => {
                const cell = row.insertCell();
                cell.textContent = shipmentcontainer[col] || 'N/A';
            });
        });

        console.log('Table populated successfully');
    } catch (error) {
        console.error('Error in fetchAndDisplayShipmentContainer:', error);
    }

}

// This function resets or initializes SHIPMENTCONTAINER.
async function resetShipmentContainer() {
    const response = await fetch("/initiate-shipmentcontainer", {
        method: 'POST'
    });
    const responseData = await response.json();

    if (responseData.success) {
        const messageElement = document.getElementById('resetShipmentContainerResultMsg');
        messageElement.textContent = "shipmentcontainer initiated successfully!";
        fetchTableData();
    } else {
        alert("Error initiating table!");
    }
}

// as function name suggests
async function fetchAndDisplayHomeCountriesWithAllTradeAgreements() {
    const messageElement = document.getElementById('homeCountriesWithAllTradeAgreementsMessage');
    const tableElement = document.getElementById('homeCountriesWithAllTradeAgreements');
    const tableBody = tableElement.querySelector('tbody');

    try {
        const response = await fetch('/homecountries-with-all-tradeagreements', { method: 'GET' });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const responseData = await response.json();

        if (responseData.success && Array.isArray(responseData.data)) {
            tableBody.innerHTML = ''; // Clear old content

            responseData.data.forEach(row => {
                const tableRow = tableBody.insertRow();
                const cell = tableRow.insertCell();
                cell.textContent = row.NAME || 'N/A';
            });

            tableElement.style.display = 'block';
            messageElement.textContent = '';
        } else {
            throw new Error('Unexpected response format or data');
        }
    } catch (error) {
        console.error('Error fetching home countries with all trade agreements:', error);
        messageElement.textContent = 'Failed to load data.';
        tableElement.style.display = 'none';
    }
}

// asses user input from HTML to appService to run function
async function runDynamicShipQuery(event) {
    event.preventDefault();

    const queryInput = document.getElementById('shipQueryInput').value;

    try {
        const response = await fetch('/ship-query', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: queryInput }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const responseData = await response.json();
        const tableBody = document.getElementById('shipQueryResultsTable').querySelector('tbody');

        // Clear old results
        tableBody.innerHTML = '';

        if (responseData.success && Array.isArray(responseData.data)) {
            responseData.data.forEach(ship => {
                const row = tableBody.insertRow();
                ['OWNER', 'SHIPNAME', 'SHIPSIZE', 'CAPACITY', 'SHIPPINGROUTENAME', 'DOCKEDATPORTADDRESS'].forEach(attr => {
                    const cell = row.insertCell();
                    cell.textContent = ship[attr] || 'N/A';
                });
            });
        } else {
            const row = tableBody.insertRow();
            const cell = row.insertCell();
            cell.colSpan = 6;
            cell.textContent = 'No results found';
        }
    } catch (error) {
        console.error('Error running dynamic ship query:', error);
    }
}

// passes user input for join to appService
async function joinCompanyShipment({ companyName, companyCEO }) {
    try {
        const response = await fetch('/join-Company-Shipment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ companyName, companyCEO }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const responseData = await response.json();
        const tableBody = document.getElementById('joinCompanyShipmentResultsTable').querySelector('tbody');

        // Clear old results
        tableBody.innerHTML = '';

        if (responseData.success && Array.isArray(responseData.data)) {
            if (responseData.data.length === 0) {
                const row = tableBody.insertRow();
                const cell = row.insertCell();
                cell.colSpan = 7;
                cell.textContent = responseData.message || "No results found.";
            } else {
                responseData.data.forEach(shipment => {
                    const row = tableBody.insertRow();
                    ['SHIPOWNER', 'SHIPNAME', 'GOODTYPE', 'TRACKINGNUMBER', 'COMPANYNAME', 'COMPANYCEO', 'INDUSTRY', 'YEARLYREVENUE'].forEach(attr => {
                        const cell = row.insertCell();
                        cell.textContent = shipment[attr] || 'N/A';
                    });
                });
            }
        } else {
            const row = tableBody.insertRow();
            const cell = row.insertCell();
            cell.colSpan = 7; // Adjust this to match the total number of columns
            cell.textContent = 'Failed to retrieve data.';
        }
    } catch (error) {
        console.error('Error in joinCompanyShipment:', error);
        alert("An error occurred while fetching data. Please try again.");
    }
}

// formats and sends user input from html to appService
async function projectShippingRoute(attributes) {
    try {
        const response = await fetch('/project-shipping-route', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ attributes }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const responseData = await response.json();
        const tableBody = document.getElementById('shippingRouteResultsTable').querySelector('tbody');

        // Clear old results
        tableBody.innerHTML = '';

        if (responseData.success && Array.isArray(responseData.data)) {
            if (responseData.data.length === 0) {
                const row = tableBody.insertRow();
                const cell = row.insertCell();
                cell.colSpan = attributes.length; // Number of selected columns
                cell.textContent = "No results found.";
            } else {
                responseData.data.forEach(rowData => {
                    const row = tableBody.insertRow();
                    attributes.forEach(attr => {
                        const key = attr.split('.').pop().toUpperCase(); // Convert to uppercase to match Oracle keys
                        const value = rowData[key];
                        console.log(`Key: ${key}, Value: ${value}`); // Debugging output
                        const cell = row.insertCell();
                        cell.textContent = value !== null && value !== undefined ? value : 'N/A';
                    });
                });
            }
        } else {
            const row = tableBody.insertRow();
            const cell = row.insertCell();
            cell.colSpan = attributes.length; // Number of selected columns
            cell.textContent = 'Failed to retrieve data.';
        }
    } catch (error) {
        console.error('Error in projectShippingRoute:', error);
        alert("An error occurred while fetching data. Please try again.");
    }
}



// ---------------------------------------------------------------
// Initializes the webpage functionalities.
// Add or remove event listeners based on the desired functionalities.
window.onload = async function() {
    console.log('Page loaded, initializing...');
    checkDbConnection();

    try {
        await initiateAll();
        await fetchTableData();
    } catch (error) {
        console.error("Error during initialization:", error);
        alert("Failed to initialize. Please try again.");
    }

    // Add event listeners
    document.getElementById("initiateAll").addEventListener("click", async () => {
        await fetchTableData();
        await initiateAll();
        await fetchTableData();
    });
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
    document.getElementById("resetTariff").addEventListener("click", async () => {
        await resetTariff();
        await fetchAndDisplayTariff();  // Refresh table after reset
    });
    document.getElementById("resetShippingRoute").addEventListener("click", async () => {
        await resetShippingRoute();
        await fetchAndDisplayShippingRoute();  // Refresh table after reset
    });
    document.getElementById("resetShip").addEventListener("click", async () => {
        await resetShip();
        await fetchAndDisplayShip();  // Refresh table after reset
    });
    document.getElementById("resetCompany").addEventListener("click", async () => {
        await resetCompany();
        await fetchAndDisplayCompany();  // Refresh table after reset
    });
    document.getElementById("resetShipmentContainer").addEventListener("click", async () => {
        await resetShipmentContainer();
        await fetchAndDisplayShipmentContainer();  // Refresh table after reset
    });

    document.getElementById("insertCountry").addEventListener("submit", async (e) => {
        await insertCountry(e);
        await fetchAndDisplayCountry();  // Refresh table after insert
    });
    document.getElementById("insertHomeCountry").addEventListener("submit", async (e) => {
        await insertHomeCountry(e);
    });
    document.getElementById("updateCountry").addEventListener("submit", async (e) => {
        await updateCountry(e);
        await fetchAndDisplayCountry();  // Refresh table after update
    });
    document.getElementById("deletePort").addEventListener("submit", async (e) => {
        await deletePortCall(e);
        await fetchAndDisplayPort();
    });

    document.getElementById("numShips").addEventListener("submit", async (e) => {
        await numShip(e);
    });

    document.getElementById("groupBy").addEventListener("submit", async (e) => {
        await maxAverage(e);
    });

    // document.getElementById("countCountry").addEventListener("click", countCountry);
    document.getElementById('countCountriesByGDPButton').addEventListener('click', countCountry);

    document.getElementById("fetchHomeCountriesWithAllTradeAgreements").addEventListener("click", async (e) => {
        await fetchAndDisplayHomeCountriesWithAllTradeAgreements(e);
        await fetchTableData();
    });

    document.getElementById('shipQueryForm').addEventListener('submit', runDynamicShipQuery);

    // Event listener for form submission
    document.getElementById('joinCompanyShipmentInput').addEventListener('submit', async (event) => {
        event.preventDefault();

        const companyName = document.getElementById('inputCompanyName').value.trim();
        const companyCEO = document.getElementById('inputCompanyCEO').value.trim();

        if (!companyName || !companyCEO) {
            alert("Please provide both the company name and CEO.");
            return;
        }

        await joinCompanyShipment({ companyName, companyCEO });
    });

    // Show input fields when the button is clicked
    document.getElementById("showInputButton").addEventListener("click", () => {
        document.getElementById("joinCompanyShipmentInput").style.display = "block";
    });

    // Handle form submission
    document.getElementById('shippingRouteForm').addEventListener('submit', async (event) => {
        event.preventDefault();

        // Get selected attributes
        const checkboxes = document.querySelectorAll('input[name="attribute"]:checked');
        const selectedAttributes = Array.from(checkboxes).map(checkbox => checkbox.value);

        if (selectedAttributes.length === 0) {
            alert("Please select at least one attribute.");
            return;
        }

        // Fetch and display results
        await projectShippingRoute(selectedAttributes);
    });
}

// General function to refresh the displayed table data.
// You can invoke this after any table-modifying operation to keep consistency.
    async function fetchTableData() {
        await fetchAndDisplayCountry();
        await fetchAndDisplayPort();
        await fetchAndDisplayWarehouse();
        await fetchAndDisplayHomeCountry();
        await fetchAndDisplayForeignCountry();
        await fetchAndDisplayTariff();
        await fetchAndDisplayShippingRoute();
        await fetchAndDisplayShip();
        await fetchAndDisplayCompany();
        await fetchAndDisplayShipmentContainer();
    }

    async function test() {
        try {
            incNumContainers(aa, aa)
        } catch (error) {
            if (error instanceof CapacityError) {
            }
        }
    }

