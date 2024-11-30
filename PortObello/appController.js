const express = require('express');
const appService = require('./appService');

const router = express.Router();

// ----------------------------------------------------------
// API endpoints
// Functions for posting or getting appService.js data
// Called by scripts.js
router.get('/check-db-connection', async (req, res) => {
    const isConnect = await appService.testOracleConnection();
    if (isConnect) {
        res.send('connected');
    } else {
        res.send('unable to connect');
    }
});

router.post("/initiate-all", async (req, res) => {
    const initiateResult = await appService.initiateAll();
    if (initiateResult) {
        res.json({ success: true });
    } else {
        res.status(500).json({ success: false });
    }
});

router.get('/country', async (req, res) => {
    const tableContent = await appService.fetchCountryFromDb();
    res.json({data: tableContent});
});

router.post("/initiate-country", async (req, res) => {
    const initiateResult = await appService.initiateCountry();
    if (initiateResult) {
        res.json({ success: true });
    } else {
        res.status(500).json({ success: false });
    }
});

router.post("/insert-country", async (req, res) => {
    console.log('Received request:', req.body);
    const { name, population, government, gdp, portaddress } = req.body;
    const insertResult = await appService.insertCountry(name, population, government, gdp, portaddress);
    if (insertResult) {
        res.json({ success: true });
    } else {
        res.status(500).json({ success: false });
    }
});

router.post("/ship-to-port", async (req, res) => {
    const initiateResult = await appService.shipToPort();
    if (initiateResult) {
        res.json({ success: true });
    } else {
        res.status(500).json({ success: false });
    }
});

router.post("/update-country", async (req, res) => {
    const { cname, population, government, portaddress, gdp } = req.body;
    const updateResult = await appService.updateCountry(cname, population, government, portaddress, gdp);
    if (updateResult) {
        res.json({ success: true });
    } else {
        res.status(500).json({ success: false });
    }
});

router.get('/count-country', async (req, res) => {
    try {
        const data = await appService.countCountry();
        res.json({ success: true, data });
    } catch (err) {
        console.error('Error fetching countries by GDP ranges:', err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

router.get('/warehouse', async (req, res) => {
    const tableContent = await appService.fetchWarehouseFromDb();
    res.json({data: tableContent});
});

router.post("/initiate-warehouse", async (req, res) => {
    const initiateResult = await appService.initiateWarehouse();
    if (initiateResult) {
        res.json({ success: true });
    } else {
        res.status(500).json({ success: false });
    }
});


router.get('/port', async (req, res) => {
    const tableContent = await appService.fetchPortFromDb();
    res.json({data: tableContent});
});

router.post("/initiate-port", async (req, res) => {
    const initiateResult = await appService.initiatePort();
    if (initiateResult) {
        res.json({ success: true });
    } else {
        res.status(500).json({ success: false });
    }
});

router.get('/homecountry', async (req, res) => {
    const tableContent = await appService.fetchHomeCountryFromDb();
    res.json({data: tableContent});
});

router.post("/initiate-homecountry", async (req, res) => {
    const initiateResult = await appService.initiateHomeCountry();
    if (initiateResult) {
        res.json({ success: true });
    } else {
        res.status(500).json({ success: false });
    }
});

router.post("/insert-homecountry", async (req, res) => {
    console.log('Received request:', req.body);
    const { name, population, government, gdp, portaddress } = req.body;
    const insertResult = await appService.insertHomeCountry(name, population, government, gdp, portaddress);

    if (insertResult) {
        res.json({ success: true });
    } else {
        res.status(500).json({ success: false });
    }
});

router.get('/foreigncountry', async (req, res) => {
    const tableContent = await appService.fetchForeignCountryFromDb();
    res.json({data: tableContent});
});

router.post("/initiate-foreigncountry", async (req, res) => {
    const initiateResult = await appService.initiateForeignCountry();
    if (initiateResult) {
        res.json({ success: true });
    } else {
        res.status(500).json({ success: false });
    }
});

router.get('/tariff', async (req, res) => {
    const tableContent = await appService.fetchTariffFromDb();
    res.json({data: tableContent});
});

router.post("/initiate-tariff", async (req, res) => {
    const initiateResult = await appService.initiateTariff();
    if (initiateResult) {
        res.json({ success: true });
    } else {
        res.status(500).json({ success: false });
    }
});

router.get('/shippingroute', async (req, res) => {
    const tableContent = await appService.fetchShippingRouteFromDb();
    res.json({data: tableContent});
});

router.post("/initiate-shippingroute", async (req, res) => {
    const initiateResult = await appService.initiateShippingRoute();
    if (initiateResult) {
        res.json({ success: true });
    } else {
        res.status(500).json({ success: false });
    }
});

router.get('/ship', async (req, res) => {
    const tableContent = await appService.fetchShipFromDb();
    res.json({data: tableContent});
});

router.post("/initiate-ship", async (req, res) => {
    const initiateResult = await appService.initiateShip();
    if (initiateResult) {
        res.json({ success: true });
    } else {
        res.status(500).json({ success: false });
    }
});

router.get('/company', async (req, res) => {
    const tableContent = await appService.fetchCompanyFromDb();
    res.json({data: tableContent});
});

router.post("/initiate-company", async (req, res) => {
    const initiateResult = await appService.initiateCompany();
    if (initiateResult) {
        res.json({ success: true });
    } else {
        res.status(500).json({ success: false });
    }
});

router.get('/shipmentcontainer', async (req, res) => {
    const tableContent = await appService.fetchShipmentContainerFromDb();
    res.json({data: tableContent});
});

router.post("/initiate-shipmentcontainer", async (req, res) => {
    const initiateResult = await appService.initiateShipmentContainer();
    if (initiateResult) {
        res.json({ success: true });
    } else {
        res.status(500).json({ success: false });
    }
});

router.post("/delete-port", async (req, res) => {
    const { addy } = req.body;
    const initiateResult = await appService.deletePort(addy);
    if (initiateResult) {
        res.json({ success: true });
    } else {
        res.status(500).json({ success: false });
    }
});

router.post("/delete-warehouse", async (req, res) => {
    const { pAddy, wSection } = req.body;
    const initiateResult = await appService.deleteWarehouse(pAddy, wSection);
    if (initiateResult) {
        res.json({ success: true });
    } else {
        res.status(500).json({ success: false });
    }
});

router.post("/delete-tariff", async (req, res) => {
    const { tName } = req.body;
    const initiateResult = await appService.deleteTariff(tName);
    if (initiateResult) {
        res.json({ success: true });
    } else {
        res.status(500).json({ success: false });
    }
});

router.post("/delete-company", async (req, res) => {
    const { cName, ceo } = req.body;
    const initiateResult = await appService.deleteCompany(cName, ceo);
    if (initiateResult) {
        res.json({ success: true });
    } else {
        res.status(500).json({ success: false });
    }
});

router.post("/delete-ship", async (req, res) => {
    const { sOwner, sName } = req.body;
    const initiateResult = await appService.deleteShip(sOwner, sName);
    if (initiateResult) {
        res.json({ success: true });
    } else {
        res.status(500).json({ success: false });
    }
});

router.post("/delete-shipping-route", async (req, res) => {
    const { sName } = req.body;
    const initiateResult = await appService.deleteShippingRoute(sName);
    if (initiateResult) {
        res.json({ success: true });
    } else {
        res.status(500).json({ success: false });
    }
});

router.get("/max-ship-average", async (req, res) => {
    const initiateResult = await appService.maxAvgContainer();

    if (initiateResult) {
        res.json({
            shipName: initiateResult.shipName,
            maxAvg: initiateResult.maxAvg
        });
    } else {
        res.json({ message: "ERROR: No data found for the max average." });
    }
});

router.post("/port-num-ship", async (req, res) => {
    const {min, max} = req.body;
    try {
        const result = await appService.portsNumShips(min, max);
        res.json({ success: true, data: result });
    } catch (err) {
        console.error('Error finding populated ports:', err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

router.post('/join-Company-Shipment', async (req, res) => {
    const { companyName, companyCEO } = req.body;

    if (!companyName || !companyCEO) {
        return res.status(400).json({ success: false, message: "Both companyName and companyCEO are required." });
    }

    try {
        const shipments = await appService.joinCompanyShipments(companyName, companyCEO);
        if (shipments && shipments.length > 0) {
            res.json({ success: true, data: shipments });
        } else {
            res.json({ success: true, data: [], message: "No shipments found for the specified company." });
        }
    } catch (error) {
        console.error("Error in /join-Company-Shipment route:", error);
        res.status(500).json({ success: false, message: "Internal server error." });
    }
});

router.post('/project-shipping-route', async (req, res) => {
    const { attributes } = req.body;

    if (!Array.isArray(attributes) || attributes.length === 0) {
        return res.status(400).json({ success: false, message: "Invalid or missing attributes." });
    }

    try {
        const results = await appService.projectShippingRoute(attributes);
        res.json({ success: true, data: results });
    } catch (error) {
        console.error("Error in /project-shipping-route route:", error);
        res.status(500).json({ success: false, message: "Internal server error." });
    }
});


router.post("/remove-Shipment-Container", async (req, res) => {
    const { shipOwner, shipName, portAddress, section } = req.body;
    const initiateResult = await appService.removeShipmentContainer(shipOwner, shipName, portAddress, section)
    if (initiateResult) {
        res.json({ success: true });
    } else {
        res.status(500).json({ success: false });
    }
});

router.post("/add-Shipment-Container", async (req, res) => {
    const { shipOwner, shipName, portAddress, section } = req.body;
    const initiateResult = await appService.addShipmentContainer(shipOwner, shipName, portAddress, section)
    if (initiateResult) {
        res.json({ success: true });
    } else {
        res.status(500).json({ success: false });
    }
});

router.post("/update-Num-Containers", async (req, res) => {
    const { portAddress, section, n } = req.body;
    const initiateResult = await appService.updateNumContainers(portAddress, section, n)
    if (initiateResult) {
        res.json({ success: true });
    } else {
        res.status(500).json({ success: false });
    }
});
router.get("/homecountries-with-all-tradeagreements", async (req, res) => {
    try {
        const data = await appService.fetchHomeCountriesWithAllTradeAgreements();
        res.json({ success: true, data });
    } catch (err) {
        console.error('Error fetching home countries with all trade agreements:', err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

router.post('/ship-query', async (req, res) => {
    const { query } = req.body;

    try {
        const result = await appService.runDynamicShipQuery(query);
        res.json({ success: true, data: result });
    } catch (err) {
        console.error('Error running dynamic ship query:', err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});



module.exports = router;