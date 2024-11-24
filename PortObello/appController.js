const express = require('express');
const appService = require('./appService');

const router = express.Router();

// ----------------------------------------------------------
// API endpoints
// Modify or extend these routes based on your project's needs.
router.get('/check-db-connection', async (req, res) => {
    const isConnect = await appService.testOracleConnection();
    if (isConnect) {
        res.send('connected');
    } else {
        res.send('unable to connect');
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

router.post("/update-name-country", async (req, res) => {
    const { oldName, newName } = req.body;
    const updateResult = await appService.updateNameCountry(oldName, newName);
    if (updateResult) {
        res.json({ success: true });
    } else {
        res.status(500).json({ success: false });
    }
});

router.get('/count-country', async (req, res) => {
    const tableCount = await appService.countCountry();
    if (tableCount >= 0) {
        res.json({ 
            success: true,  
            count: tableCount
        });
    } else {
        res.status(500).json({ 
            success: false, 
            count: tableCount
        });
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

module.exports = router;

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


module.exports = router;