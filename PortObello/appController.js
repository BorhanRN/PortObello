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

router.get('country', async (req, res) => {
    const tableContent = await appService.fetchCountryFromDb();
    res.json({data: tableContent});
});

router.post("/ship-to-port", async (req, res) => {
    const initiateResult = await appService.shipToPort();
    if (initiateResult) {
        res.json({ success: true });
    } else {
        res.status(500).json({ success: false });
    }
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
    const { name, population, government, gdp, portaddress } = req.body;
    const insertResult = await appService.insertCountry(name, population, government, gdp, portaddress);
    if (insertResult) {
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


module.exports = router;