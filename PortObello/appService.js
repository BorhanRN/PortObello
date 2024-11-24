const oracledb = require('oracledb');
const loadEnvFile = require('./utils/envUtil');

const envVariables = loadEnvFile('./.env');

// Database configuration setup. Ensure your .env file has the required database credentials.
const dbConfig = {
    user: envVariables.ORACLE_USER,
    password: envVariables.ORACLE_PASS,
    connectString: `${envVariables.ORACLE_HOST}:${envVariables.ORACLE_PORT}/${envVariables.ORACLE_DBNAME}`,
    poolMin: 1,
    poolMax: 3,
    poolIncrement: 1,
    poolTimeout: 60
};

// initialize connection pool
async function initializeConnectionPool() {
    try {
        await oracledb.createPool(dbConfig);
        console.log('Connection pool started');
    } catch (err) {
        console.error('Initialization error: ' + err.message);
    }
}

async function closePoolAndExit() {
    console.log('\nTerminating');
    try {
        await oracledb.getPool().close(10); // 10 seconds grace period for connections to finish
        console.log('Pool closed');
        process.exit(0);
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
}

initializeConnectionPool();

process
    .once('SIGTERM', closePoolAndExit)
    .once('SIGINT', closePoolAndExit);


// ----------------------------------------------------------
// Wrapper to manage OracleDB actions, simplifying connection handling.
async function withOracleDB(action) {
    let connection;
    try {
        connection = await oracledb.getConnection(); // Gets a connection from the default pool 
        return await action(connection);
    } catch (err) {
        console.error(err);
        throw err;
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error(err);
            }
        }
    }
}


// ----------------------------------------------------------
// Core functions for database operations
// Modify these functions, especially the SQL queries, based on your project's requirements and design.
async function testOracleConnection() {
    return await withOracleDB(async (connection) => {
        return true;
    }).catch(() => {
        return false;
    });
}

async function fetchCountryFromDb() {
    return await withOracleDB(async (connection) => {
        try {
            console.log('Executing SELECT query on COUNTRY table...');
            const result = await connection.execute(
                'SELECT * FROM COUNTRY',
                [],
                { outFormat: oracledb.OUT_FORMAT_OBJECT }

            );
            console.log('Query result:', result);
            return result.rows;



        } catch (err) {
            console.error('Error fetching country data:', err);
            throw err;
        }
    }).catch((err) => {
        console.error('Error in fetchCountryFromDb:', err);
        return [];
    });
}

async function initiateCountry() {
    return await withOracleDB(async (connection) => {
        try {
            // First, try to find any foreign key constraints referencing COUNTRY
            const findFKsQuery = `
                SELECT table_name, constraint_name 
                FROM user_constraints 
                WHERE r_constraint_name IN (
                    SELECT constraint_name 
                    FROM user_constraints 
                    WHERE table_name = 'COUNTRY' 
                    AND constraint_type = 'P'
                )`;

            console.log('Checking for foreign key constraints...');
            const fkResult = await connection.execute(findFKsQuery);

            // Drop any foreign key constraints found
            for (let fk of fkResult.rows || []) {
                try {
                    const dropFKQuery = `ALTER TABLE ${fk[0]} DROP CONSTRAINT ${fk[1]}`;
                    await connection.execute(dropFKQuery);
                    console.log(`Dropped foreign key: ${fk[1]} from table ${fk[0]}`);
                } catch (err) {
                    console.log(`Error dropping foreign key ${fk[1]}:`, err.message);
                }
            }

            // Now try to drop the COUNTRY table
            try {
                await connection.execute('DROP TABLE COUNTRY PURGE');
                console.log('Existing COUNTRY table dropped');
            } catch (err) {
                console.log('Error dropping COUNTRY table:', err.message);
            }

            // Create the table
            await connection.execute(`
                CREATE TABLE COUNTRY (
                    Name        VARCHAR2(100) NOT NULL,
                    Population  NUMBER,
                    Government  VARCHAR2(100),
                    GDP         NUMBER,
                    PortAddress VARCHAR2(200) NOT NULL,
                    PRIMARY KEY (Name)
                )`);

            console.log('COUNTRY table created');

            // Insert initial data
            const insertStatements = [
                ['Canada', 38930000, 'Liberal Party - Justin Trudeau', 2.14, '999 Canada Pl, Vancouver, BC V6C 3T4'],
                ['USA', 333300000, 'Democratic Party - Joe Biden', 27.36, 'Signal St, San Pedro, CA 90731, United States'],
                ['China', 1412000000, 'Chinese Communist Party - Xi Jinping',17.79, 'Shengsi County, Zhoushan, China, 202461'],
                ['Japan', 125100000, 'Liberal Democratic Party - Shigeru Ishiba', 4.21, '4 - chōme - 8 Ariake, Koto City, Tokyo 135-0063, Japan'],
                ['Netherlands', 177000000, 'Independent - Dick Schoof',1.12, 'Wilhelminakade 909, 3072 AP Rotterdam, Netherlands'],
                ['Russia', 146000000, 'United Russia - Vladimir Putin',  1680.0, 'xxx'],
                ['India', 1390000000, 'Bharatiya Janata Party - Narendra Modi',  1680.0, 'yyy'],
                ['Brazil', 213000000, 'Workers Party - Luiz Inácio Lula da Silva', 1505.0, 'zzz'],
                ['UK', 67000000, 'Conservative Party - Rishi Sunak', 3031.0, 'xyz']

        ];

            // Use bind variables for safer insertion
            const insertSQL = `
                INSERT INTO COUNTRY (Name, Population, Government, GDP, PortAddress) 
                VALUES (:1, :2, :3, :4, :5)`;

            for (const data of insertStatements) {
                await connection.execute(insertSQL, data);
                console.log('Inserted data for:', data[0]);
            }

            await connection.commit();
            console.log('All data inserted and committed');
            return true;
        } catch (err) {
            console.error('Error in initiateCountry:', err);
            await connection.rollback();
            throw err;
        }
    }).catch((err) => {
        console.error('Failed to initiate country:', err);
        return false;
    });
}

async function insertCountry(name, population, government, gdp, portaddress) {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute(
            `INSERT INTO COUNTRY (name, population, government, gdp, PortAddress) VALUES (:name, :population, :government, :gdp, :PortAddress)`,
            [name, population, government, gdp, portaddress],
            { autoCommit: true }
        );

        return result.rowsAffected && result.rowsAffected > 0;
    }).catch(() => {
        return false;
    });
}

async function updateNameCountry(oldName, newName) {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute(
            `UPDATE COUNTRY SET name=:newName where name=:oldName`,
            [newName, oldName],
            { autoCommit: true }
        );

        return result.rowsAffected && result.rowsAffected > 0;
    }).catch(() => {
        return false;
    });
}


async function countCountry() {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute('SELECT Count(*) FROM COUNTRY');
        return result.rows[0][0];
    }).catch(() => {
        return -1;
    });
}

async function fetchPortFromDb() {
    return await withOracleDB(async (connection) => {
        try {
            console.log('Executing SELECT query on PORT table...');
            const result = await connection.execute(
                'SELECT * FROM PORT',
                [],
                { outFormat: oracledb.OUT_FORMAT_OBJECT }

            );
            console.log('Query result:', result);
            return result.rows;



        } catch (err) {
            console.error('Error fetching port data:', err);
            throw err;
        }
    }).catch((err) => {
        console.error('Error in fetchPortFromDb:', err);
        return [];
    });
}

async function initiatePort() {
    return await withOracleDB(async (connection) => {
        try {
            // First, try to find any foreign key constraints referencing WAREHOUSE
            const findFKsQuery = `
                SELECT table_name, constraint_name 
                FROM user_constraints 
                WHERE r_constraint_name IN (
                    SELECT constraint_name 
                    FROM user_constraints 
                    WHERE table_name = 'PORT' 
                    AND constraint_type = 'P'
                )`;

            console.log('Checking for foreign key constraints...');
            const fkResult = await connection.execute(findFKsQuery);

            // Drop any foreign key constraints found
            for (let fk of fkResult.rows || []) {
                try {
                    const dropFKQuery = `ALTER TABLE ${fk[0]} DROP CONSTRAINT ${fk[1]}`;
                    await connection.execute(dropFKQuery);
                    console.log(`Dropped foreign key: ${fk[1]} from table ${fk[0]}`);
                } catch (err) {
                    console.log(`Error dropping foreign key ${fk[1]}:`, err.message);
                }
            }

            // Now try to drop the PORT table
            try {
                await connection.execute('DROP TABLE PORT PURGE');
                console.log('Existing PORT table dropped');
            } catch (err) {
                console.log('Error dropping PORT table:', err.message);
            }

            // Create the table
            await connection.execute(`
                CREATE TABLE Port
                (
                    PortAddress VARCHAR2(200) NOT NULL,
                    NumWorkers  NUMBER,
                    DockedShips NUMBER,
                    CountryName VARCHAR2(100),
                    PRIMARY KEY (PortAddress),
                    FOREIGN KEY (CountryName) REFERENCES Country (Name) ON DELETE CASCADE
                )`);

            console.log('PORT table created');

            // Insert initial data
            const insertStatements = [
                ['999 Canada Pl, Vancouver, BC V6C 3T4', 523, 53, 'Canada'],
                ['Shengsi County, Zhoushan, China, 202461', 13546, 123,'China'],
                ['Wilhelminakade 909, 3072 AP Rotterdam, Netherlands', 1270, 225,'Netherlands'],
                ['Signal St, San Pedro, CA 90731, United States', 1230, 67,'USA'],
                ['4 - chōme - 8 Ariake, Koto City, Tokyo 135-0063, Japan', 30000, 44,'Japan']
            ];

            // Use bind variables for safer insertion
            const insertSQL = `
                INSERT INTO PORT (PortAddress, NumWorkers, DockedShips, CountryName) 
                VALUES (:1, :2, :3, :4)`;

            for (const data of insertStatements) {
                await connection.execute(insertSQL, data);
                console.log('Inserted data for:', data[0]);
            }

            await connection.commit();
            console.log('All data inserted and committed');
            return true;
        } catch (err) {
            console.error('Error in initiatePort:', err);
            await connection.rollback();
            throw err;
        }
    }).catch((err) => {
        console.error('Failed to initiate port:', err);
        return false;
    });
}

async function fetchWarehouseFromDb() {
    return await withOracleDB(async (connection) => {
        try {
            console.log('Executing SELECT query on WAREHOUSE table...');
            const result = await connection.execute(
                'SELECT * FROM WAREHOUSE',
                [],
                { outFormat: oracledb.OUT_FORMAT_OBJECT }

            );
            console.log('Query result:', result);
            return result.rows;



        } catch (err) {
            console.error('Error fetching warehouse data:', err);
            throw err;
        }
    }).catch((err) => {
        console.error('Error in fetchWarehouseFromDb:', err);
        return [];
    });
}

async function initiateWarehouse() {
    return await withOracleDB(async (connection) => {
        try {
            // First, try to find any foreign key constraints referencing WAREHOUSE
            const findFKsQuery = `
                SELECT table_name, constraint_name 
                FROM user_constraints 
                WHERE r_constraint_name IN (
                    SELECT constraint_name 
                    FROM user_constraints 
                    WHERE table_name = 'WAREHOUSE' 
                    AND constraint_type = 'P'
                )`;

            console.log('Checking for foreign key constraints...');
            const fkResult = await connection.execute(findFKsQuery);

            // Drop any foreign key constraints found
            for (let fk of fkResult.rows || []) {
                try {
                    const dropFKQuery = `ALTER TABLE ${fk[0]} DROP CONSTRAINT ${fk[1]}`;
                    await connection.execute(dropFKQuery);
                    console.log(`Dropped foreign key: ${fk[1]} from table ${fk[0]}`);
                } catch (err) {
                    console.log(`Error dropping foreign key ${fk[1]}:`, err.message);
                }
            }

            // Now try to drop the WAREHOUSE table
            try {
                await connection.execute('DROP TABLE WAREHOUSE PURGE');
                console.log('Existing WAREHOUSE table dropped');
            } catch (err) {
                console.log('Error dropping WAREHOUSE table:', err.message);
            }

            // Create the table
            await connection.execute(`
                CREATE TABLE Warehouse
                (
                    PortAddress   VARCHAR2(200) NOT NULL,
                    Section       NUMBER,
                    NumContainers NUMBER,
                    Capacity      NUMBER,
                    PRIMARY KEY (PortAddress, Section),
                    FOREIGN KEY (PortAddress) REFERENCES Port (PortAddress) ON DELETE CASCADE
                )`);

            console.log('WAREHOUSE table created');

            // Insert initial data
            const insertStatements = [
                [1, 90, 100, '999 Canada Pl, Vancouver, BC V6C 3T4'],
                [2, 200, 300, '999 Canada Pl, Vancouver, BC V6C 3T4'],
                [3, 200, 200, '999 Canada Pl, Vancouver, BC V6C 3T4'],
                [1, 631, 1000, 'Shengsi County, Zhoushan, China, 202461'],
                [9, 10, 220, 'Wilhelminakade 909, 3072 AP Rotterdam, Netherlands']
            ];

            // Use bind variables for safer insertion
            const insertSQL = `
                INSERT INTO WAREHOUSE (Section, NumContainers, Capacity, PortAddress) 
                VALUES (:1, :2, :3, :4)`;

            for (const data of insertStatements) {
                await connection.execute(insertSQL, data);
                console.log('Inserted data for:', data[0]);
            }

            await connection.commit();
            console.log('All data inserted and committed');
            return true;
        } catch (err) {
            console.error('Error in initiateWarehouse:', err);
            await connection.rollback();
            throw err;
        }
    }).catch((err) => {
        console.error('Failed to initiate warehouse:', err);
        return false;
    });
}


async function fetchHomeCountryFromDb() {
    return await withOracleDB(async (connection) => {
        try {
            console.log('Executing SELECT query on HOMECOUNTRY table...');
            const result = await connection.execute(
                'SELECT * FROM HOMECOUNTRY',
                [],
                { outFormat: oracledb.OUT_FORMAT_OBJECT }

            );
            console.log('Query result:', result);
            return result.rows;



        } catch (err) {
            console.error('Error fetching homecountry data:', err);
            throw err;
        }
    }).catch((err) => {
        console.error('Error in fetchHomeCountryFromDb:', err);
        return [];
    });
}

async function initiateHomeCountry() {
    return await withOracleDB(async (connection) => {
        try {
            // First, try to find any foreign key constraints referencing HOMECOUNTRY
            const findFKsQuery = `
                SELECT table_name, constraint_name 
                FROM user_constraints 
                WHERE r_constraint_name IN (
                    SELECT constraint_name 
                    FROM user_constraints 
                    WHERE table_name = 'HOMECOUNTRY' 
                    AND constraint_type = 'P'
                )`;

            console.log('Checking for foreign key constraints...');
            const fkResult = await connection.execute(findFKsQuery);

            // Drop any foreign key constraints found
            for (let fk of fkResult.rows || []) {
                try {
                    const dropFKQuery = `ALTER TABLE ${fk[0]} DROP CONSTRAINT ${fk[1]}`;
                    await connection.execute(dropFKQuery);
                    console.log(`Dropped foreign key: ${fk[1]} from table ${fk[0]}`);
                } catch (err) {
                    console.log(`Error dropping foreign key ${fk[1]}:`, err.message);
                }
            }

            // Now try to drop the PORT table
            try {
                await connection.execute('DROP TABLE HOMECOUNTRY PURGE');
                console.log('Existing HOMECOUNTRY table dropped');
            } catch (err) {
                console.log('Error dropping HOMECOUNTRY table:', err.message);
            }

            // Create the table
            await connection.execute(`
                CREATE TABLE HomeCountry
                (
                    Name       VARCHAR2(100) NOT NULL,
                    Population NUMBER,
                    GDP        FLOAT,
                    Government VARCHAR2(100),
                    DockingFee FLOAT,
                    PRIMARY KEY (Name),
                    FOREIGN KEY (Name) REFERENCES Country (Name) ON DELETE CASCADE
                )`);

            console.log('HOMECOUNTRY table created');

            // Insert initial data
            const insertStatements = [
                ['Canada', 38000000, 2.14, 'Liberal Party - Justin Trudeau', 500.0],
                ['USA', 331000000, 27.36, 'Democratic Party - Joe Biden', 600.0],
                ['China', 83000000, 17.79, 'Chinese Communist Party - Xi Jinping', 550.0],
                ['Japan', 125800000, 4.21, 'Liberal Democratic Party - Shigeru Ishiba', 580.0],
                ['Netherlands', 25600000, 1.12, 'Independent - Dick Schoof', 470.0],
                ['Russia', 146000000, 1680.0, 'United Russia - Vladimir Putin', 620.0],
                ['India', 1390000000, 2875.0, 'Bharatiya Janata Party - Narendra Modi', 580.0],
                ['Brazil', 213000000, 1505.0, 'Workers Party - Luiz Inácio Lula da Silva', 490.0],
                ['UK', 67000000, 3031.0, 'Conservative Party - Rishi Sunak', 550.0]
            ];

            // Use bind variables for safer insertion
            const insertSQL = `
                INSERT INTO HOMECOUNTRY (Name, Population, GDP, Government, DockingFee) 
                VALUES (:1, :2, :3, :4, :5)`;

            for (const data of insertStatements) {
                await connection.execute(insertSQL, data);
                console.log('Inserted data for:', data[0]);
            }

            await connection.commit();
            console.log('All data inserted and committed');
            return true;
        } catch (err) {
            console.error('Error in initiateHomeCountry:', err);
            await connection.rollback();
            throw err;
        }
    }).catch((err) => {
        console.error('Failed to initiate homecountry:', err);
        return false;
    });
}

async function fetchForeignCountryFromDb() {
    return await withOracleDB(async (connection) => {
        try {
            console.log('Executing SELECT query on FOREIGNCOUNTRY table...');
            const result = await connection.execute(
                'SELECT * FROM FOREIGNCOUNTRY',
                [],
                { outFormat: oracledb.OUT_FORMAT_OBJECT }

            );
            console.log('Query result:', result);
            return result.rows;



        } catch (err) {
            console.error('Error fetching foreigncountry data:', err);
            throw err;
        }
    }).catch((err) => {
        console.error('Error in fetchForeignCountryFromDb:', err);
        return [];
    });
}

async function initiateForeignCountry() {
    return await withOracleDB(async (connection) => {
        try {
            // First, try to find any foreign key constraints referencing FOREIGNCOUNTRY
            const findFKsQuery = `
                SELECT table_name, constraint_name 
                FROM user_constraints 
                WHERE r_constraint_name IN (
                    SELECT constraint_name 
                    FROM user_constraints 
                    WHERE table_name = 'FOREIGNCOUNTRY' 
                    AND constraint_type = 'P'
                )`;

            console.log('Checking for foreign key constraints...');
            const fkResult = await connection.execute(findFKsQuery);

            // Drop any foreign key constraints found
            for (let fk of fkResult.rows || []) {
                try {
                    const dropFKQuery = `ALTER TABLE ${fk[0]} DROP CONSTRAINT ${fk[1]}`;
                    await connection.execute(dropFKQuery);
                    console.log(`Dropped foreign key: ${fk[1]} from table ${fk[0]}`);
                } catch (err) {
                    console.log(`Error dropping foreign key ${fk[1]}:`, err.message);
                }
            }

            // Now try to drop the PORT table
            try {
                await connection.execute('DROP TABLE FOREIGNCOUNTRY PURGE');
                console.log('Existing FOREIGNCOUNTRY table dropped');
            } catch (err) {
                console.log('Error dropping FOREIGNCOUNTRY table:', err.message);
            }

            // Create the table
            await connection.execute(`
                CREATE TABLE ForeignCountry
                (
                    Name       VARCHAR2(100) NOT NULL,
                    Population NUMBER,
                    GDP        FLOAT,
                    Government VARCHAR2(100),
                    DockingFee FLOAT,
                    PRIMARY KEY (Name),
                    FOREIGN KEY (Name) REFERENCES Country (Name) ON DELETE CASCADE
                )`);

            console.log('FOREIGNCOUNTRY table created');

            // Insert initial data
            const insertStatements = [
                ['Canada', 38000000, 2.14, 'Liberal Party - Justin Trudeau', 500.0],
                ['Russia', 146000000, 1680.0, 'United Russia - Vladimir Putin', 620.0],
                ['India', 1390000000, 2875.0, 'Bharatiya Janata Party - Narendra Modi', 580.0],
                ['Brazil', 213000000, 1505.0, 'Workers Party - Luiz Inácio Lula da Silva', 490.0],
                ['UK', 67000000, 3031.0, 'Conservative Party - Rishi Sunak', 550.0],
                ['USA', 331000000, 27.36, 'Democratic Party - Joe Biden', 600.0],
                ['China', 83000000, 17.79, 'Chinese Communist Party - Xi Jinping', 550.0],
                ['Japan', 125800000, 4.21, 'Liberal Democratic Party - Shigeru Ishiba', 580.0],
                ['Netherlands', 25600000, 1.12, 'Independent - Dick Schoof', 470.0]
            ];

            // Use bind variables for safer insertion
            const insertSQL = `
                INSERT INTO FOREIGNCOUNTRY (Name, Population, GDP, Government, DockingFee) 
                VALUES (:1, :2, :3, :4, :5)`;

            for (const data of insertStatements) {
                await connection.execute(insertSQL, data);
                console.log('Inserted data for:', data[0]);
            }

            await connection.commit();
            console.log('All data inserted and committed');
            return true;
        } catch (err) {
            console.error('Error in initiateForeignCountry:', err);
            await connection.rollback();
            throw err;
        }
    }).catch((err) => {
        console.error('Failed to initiate foreigncountry:', err);
        return false;
    });
}

async function fetchTariff1FromDb() {
    return await withOracleDB(async (connection) => {
        try {
            console.log('Executing SELECT query on TARIFF1 table...');
            const result = await connection.execute(
                'SELECT * FROM TARIFF1',
                [],
                { outFormat: oracledb.OUT_FORMAT_OBJECT }

            );
            console.log('Query result:', result);
            return result.rows;



        } catch (err) {
            console.error('Error fetching tariff1 data:', err);
            throw err;
        }
    }).catch((err) => {
        console.error('Error in fetchTariff1FromDb:', err);
        return [];
    });
}

async function initiateTariff1() {
    return await withOracleDB(async (connection) => {
        try {
            // First, try to find any foreign key constraints referencing TARIFF1
            const findFKsQuery = `
                SELECT table_name, constraint_name 
                FROM user_constraints 
                WHERE r_constraint_name IN (
                    SELECT constraint_name 
                    FROM user_constraints 
                    WHERE table_name = 'TARIFF1' 
                    AND constraint_type = 'P'
                )`;

            console.log('Checking for foreign key constraints...');
            const fkResult = await connection.execute(findFKsQuery);

            // Drop any foreign key constraints found
            for (let fk of fkResult.rows || []) {
                try {
                    const dropFKQuery = `ALTER TABLE ${fk[0]} DROP CONSTRAINT ${fk[1]}`;
                    await connection.execute(dropFKQuery);
                    console.log(`Dropped foreign key: ${fk[1]} from table ${fk[0]}`);
                } catch (err) {
                    console.log(`Error dropping foreign key ${fk[1]}:`, err.message);
                }
            }

            // Now try to drop the PORT table
            try {
                await connection.execute('DROP TABLE TARIFF1 PURGE');
                console.log('Existing TARIFF1 table dropped');
            } catch (err) {
                console.log('Error dropping TARIFF1 table:', err.message);
            }

            // Create the table
            await connection.execute(`
                CREATE TABLE Tariff1
                (
                    TradeAgreement VARCHAR2(100) NOT NULL,
                    TariffRate     FLOAT,
                    HomeName       VARCHAR2(100),
                    ForeignName    VARCHAR2(100),
                    EnactmentDate  DATE,
                    PRIMARY KEY (TradeAgreement),
                    FOREIGN KEY (ForeignName) REFERENCES ForeignCountry (Name) ON DELETE CASCADE, --ON UPDATE CASCADE,
                    FOREIGN KEY (HomeName) REFERENCES HomeCountry (Name) ON DELETE CASCADE --ON UPDATE CASCADE
                )`);

            console.log('TARIFF1 table created');

            // Insert initial data
            const insertStatements = [
                ['China - USA Agreement', 12,'China','USA', new Date('2024-01-15')],
                ['Canada - China Agreement', 9,'Canada','China', new Date('2024-10-25')],
                ['Canada - Netherlands Agreement', 8,'Canada','Netherlands', new Date('2020-06-12')],
                ['Canada - USA Agreement', 5,'Canada','USA', new Date('2020-01-30')],
                ['Canada - Japan Agreement', 6,'Canada','Japan', new Date('1998-04-09')]
            ];

            // Use bind variables for safer insertion
            const insertSQL = `
                INSERT INTO TARIFF1 (TradeAgreement, TariffRate, HomeName, ForeignName, EnactmentDate) 
                VALUES (:1, :2, :3, :4, :5)`;

            for (const data of insertStatements) {
                await connection.execute(insertSQL, data);
                console.log('Inserted data for:', data[0]);
            }

            await connection.commit();
            console.log('All data inserted and committed');
            return true;
        } catch (err) {
            console.error('Error in initiateTariff1:', err);
            await connection.rollback();
            throw err;
        }
    }).catch((err) => {
        console.error('Failed to initiate tarrif1:', err);
        return false;
    });
}

//sets Ship.PortAddress to the DestinationAddress of ship.ShippingRoute
async function shipToPort(Owner, ShipName) {
    return await  withOracleDB( async (connection) => {
        const shipUpdate = await connection.execute(
            `UPDATE Ship1 h
             SET DockedAtPortAddress = (
                 SELECT c.portAddress
                 FROM ShippingRoute2 s
                          JOIN Country c ON s.DestinationCountry = c.Country
                          JOIN Ship1 h2 ON s.Name = c.ShippingRoute
                 WHERE h2.Owner = :Owner
                   AND h2.ShipName = :ShipName
                   AND h2.Owner = :Owner
             )
             WHERE Owner = :Owner AND ShipName = :ShipName`,
            [Owner, ShipName]
        );

        await connection.execute(
            `UPDATE Ship1
             SET DockedAtPortAddress = 'Ship is currently at sea.'
             WHERE DocketAtPortAddress = 'No ports from this country are currently monitored.'
            `
        );


        if (shipUpdate.rowsAffected === 0) {
            throw new Error("Ship update failed: No rows affected.");
        }

        const portUpdate = await connection.execute(
            `UPDATE Port p
             SET NumDockedShips = (NumDockedShips + 1)
             WHERE PortAddress = (
                 SELECT c.portAddress
                 FROM ShippingRoute2 s
                          JOIN Country c ON s.DestinationCountry = c.Country
                          JOIN Ship1 h2 ON s.Name = h2.ShippingRoute
                 WHERE h2.Owner = :Owner
                   AND h2.ShipName = :ShipName
             )`,
            [Owner, ShipName]
        );

        if (portUpdate.rowsAffected === 0) {
            throw new Error("Port update failed: No rows affected.");
        }

        // Commit both updates
        await connection.commit();

        return true; // Both updates succeeded
    }).catch((error) => {
        console.error("Error updating ship's port:", error);
        return false;
    });

}

async function deletePort(addy) {
    return await withOracleDB(async (connection) =>  {

        await connection.execute( `
                    DELETE FROM Warehouse
                    WHERE PortAddress =:addy
            `,
            { addy },
        );

        await connection.execute( `
                    UPDATE Country
                    SET PortAddress = 'No ports from this country are currently monitored.'
                    WHERE PortAddress =:addy
            `,
            { addy },
        );

        await connection.execute(
            `UPDATE Ship1
             SET DockedAtPortAddress = 'Ship is currently at sea.'
             WHERE DocketAtPortAddress = 'No ports from this country are currently monitored.'
            `
        );

        const deletion = await connection.execute( `
        DELETE FROM Port WHERE PortAddress =:addy
        `,
            { addy },
        );

        // Commit both updates
        await connection.commit();

        return deletion.rowsAffected && deletion.rowsAffected > 0;
    })
        .catch((error) => {
            console.error("Error deleting port:", error);
            return false;
        });
}

async function deleteShippingRoute(sName) {
    return await withOracleDB(async (connection) =>  {
        const deletion = await connection.execute( `
        DELETE FROM ShippingRoute WHERE name =:sName
        `,
            { addy },
            { autoCommit: true }
        );
        return deletion.rowsAffected && deletion.rowsAffected > 0;
    })
        .catch((error) => {
            console.error("Error deleting Shipping Route:", error);
            return false;
        });

}

async function deleteShip(sOwner, sName) {
    return await withOracleDB(async (connection) =>  {
        const deletion1 = await connection.execute( `
        DELETE FROM Ship2 
               WHERE ShipSize = (
                   SELECT ShipSize
                   FROM Ship1 s
                   WHERE s.Owner =:sOwner AND s.ShipName=:sName
                   )
        `,
        { sOwner, sName },
        );
        if (deletion1.rowsAffected == 0) {
         throw new Error("No ship with this owner/name");
        }

        const deletion2 = await connection.execute( `
        DELETE FROM Ship1 WHERE Owner =:sOwner AND ShipName=:sName
        `,
        { sOwner, sName });

        // Commit both updates
        await connection.commit();

        return deletion2.rowsAffected && deletion2.rowsAffected > 0;
    })
        .catch((error) => {
            console.error("Error deleting port:", error);
            return false;
        });

}

async function deleteWarehouse(pAddy, wSection) {
    return await withOracleDB(async (connection) =>  {
        const deletion = await connection.execute( `
        DELETE FROM Warehouse WHERE PortAddress =:pAddy AND Section=:wSection
        `,
            { pAddy, wSection },
            { autoCommit: true }
        );
        return deletion.rowsAffected && deletion.rowsAffected > 0;
    })
        .catch((error) => {
            console.error("Error deleting Warehouse:", error);
            return false;
        });

}

async function deleteCompany(cName, ceo) {
    return await withOracleDB(async (connection) =>  {
        const deletion = await connection.execute( `
        DELETE FROM Company WHERE CompanyName =:cName AND CompanyCEO =:ceo
        `,
            { cName, ceo },
            { autoCommit: true }
        );
        return deletion.rowsAffected && deletion.rowsAffected > 0;
    })
        .catch((error) => {
            console.error("Error deleting Company:", error);
            return false;
        });

}

async function deleteTariff(tName) {
    return await withOracleDB(async (connection) =>  {
        const deletion1 = await connection.execute( `
                    DELETE FROM Tariff2 t2
                    WHERE EXISTS (
                        SELECT 1
                        FROM Tariff1 t1
                        WHERE t1.TradeAgreement =: tName
                        AND t1.EnactmentDate = t2.EnactmentDate
                        AND t1.HomeName = t2.HomeName
                        AND t1.ForeignName = t2.ForeignName
                        AND t1.TariffRate = t2.TariffRate
                    )
            `,
            { sOwner, sName },
        );
        if (deletion1.rowsAffected == 0) {
            throw new Error("No Tariff with this Trade Agreement");
        }

        const deletion2 = await connection.execute( `
        DELETE FROM Tariff1 WHERE TradeAgreement =:tName
        `,
            { sOwner, sName });

        // Commit both updates
        await connection.commit();

        return deletion2.rowsAffected && deletion2.rowsAffected > 0;
    })
        .catch((error) => {
            console.error("Error deleting port:", error);
            return false;
        });

}
module.exports = {
    testOracleConnection,

    fetchCountryFromDb,
    initiateCountry,

    fetchPortFromDb,
    initiatePort,

    fetchWarehouseFromDb,
    initiateWarehouse,

    fetchHomeCountryFromDb,
    initiateHomeCountry,

    fetchForeignCountryFromDb,
    initiateForeignCountry,

    fetchTariff1FromDb,
    initiateTariff1,



    insertCountry,
    updateNameCountry,
    countCountry,

    shipToPort,

    deleteCompany,
    deleteShippingRoute,
    deleteShip,
    deletePort,
    deleteTariff,
    deleteWarehouse
};