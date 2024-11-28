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

async function initiateAll() {
    return await withOracleDB(async (connection) => {
        try {
            console.log('Starting initiateCountry...');
            await initiateCountry();
            console.log('Starting initiatePort...');
            await initiatePort();
            console.log('Starting initiateWarehouse...');
            await initiateWarehouse();
            console.log('Starting initiateHomeCountry...');
            await initiateHomeCountry();
            console.log('Starting initiateForeignCountry...');
            await initiateForeignCountry();
            console.log('Starting initiateTariff...');
            await initiateTariff();
            console.log('Starting initiateShippingRoute...');
            await initiateShippingRoute();
            console.log('Starting initiateShip...');
            await initiateShip();
            console.log('Starting initiateCompany...');
            await initiateCompany();
            console.log('Starting initiateShipmentContainer...');
            await initiateShipmentContainer();
            console.log('All tables initiated.');
            return true;
            } catch (err) {
            console.error('Error initiating all:', err);
            await connection.rollback();
            throw err;
        }
    }).catch((err) => {
        console.error('Failed to initiate all:', err);
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
                ['Russia', 146000000, 'United Russia - Vladimir Putin',  1680.0, '2, Mira St, Novorossiysk, Krasnodar Region 353900, Russia'],
                ['India', 1390000000, 'Bharatiya Janata Party - Narendra Modi',  1680.0, 'Port House Shoorji Vallabhdas Marg Mumbai, Maharastra 400 001, India'],
                ['Brazil', 213000000, 'Workers Party - Luiz Inácio Lula da Silva', 1505.0, 'Av. Conselheiro Rodrigues Alves, S/N - Porto Macuco, Santos - SP, 11015-900, Brazil'],
                ['UK', 67000000, 'Conservative Party - Rishi Sunak', 3031.0, 'Immingham DN40 2LZ, United Kingdom']

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

// async function updateNameCountry(oldName, newName) {
//     return await withOracleDB(async (connection) => {
//         const result = await connection.execute(
//             `UPDATE COUNTRY SET name=:newName where name=:oldName`,
//             [newName, oldName],
//             { autoCommit: true }
//         );
//
//         return result.rowsAffected && result.rowsAffected > 0;
//     }).catch(() => {
//         return false;
//     });
// }

async function updateCountry(cname, population, government, portaddress, gdp) {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute(
            `UPDATE COUNTRY 
                SET population=:population,
                    government=:government,
                    portaddress=:portaddress,
                    gdp=:gdp
                   WHERE name=:cname`,
            [population, government, portaddress, gdp, cname],
            { autoCommit: true }
        );

        const result2 = await connection.execute(
            `UPDATE HOMECOUNTRY 
                SET population=:population,
                    government=:government,
                    portaddress=:portaddress,
                    gdp=:gdp
                   WHERE name=:cname`,
            [population, government, portaddress, gdp, cname],
            { autoCommit: true }
        );

        const result3 = await connection.execute(
            `UPDATE FOREIGNCOUNTRY 
                SET population=:population,
                    government=:government,
                    portaddress=:portaddress,
                    gdp=:gdp
                   WHERE name=:cname`,
            [population, government, portaddress, gdp, cname],
            { autoCommit: true }
        );



        return result.rowsAffected > 0 && result2.rowsAffected > 0 && result3.rowsAffected > 0;
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

async function fetchNumShipsFromDB() {
    return await withOracleDB(async (connection) => {
        try {
            console.log('Grabbing the new NumShips table...');
            const result = await connection.execute(
                'SELECT * FROM shipPorts',
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
        console.error('fetchNumShipsFromDB:', err);
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
                    WarehouseSection       NUMBER,
                    NumContainers NUMBER,
                    Capacity      NUMBER,
                    PRIMARY KEY (PortAddress, WarehouseSection),
                    FOREIGN KEY (PortAddress) REFERENCES Port (PortAddress) ON DELETE CASCADE
                )`);

            console.log('WAREHOUSE table created');

            // Insert initial data
            const insertStatements = [
                [1, 90, 100,'999 Canada Pl, Vancouver, BC V6C 3T4'],
                [2, 200, 300,'Shengsi County, Zhoushan, China, 202461'],
                [3, 200, 200,'Wilhelminakade 909, 3072 AP Rotterdam, Netherlands'],
                [4, 631, 1000,'Signal St, San Pedro, CA 90731, United States'],
                [9, 10, 220,'4 - chōme - 8 Ariake, Koto City, Tokyo 135-0063, Japan']
            ];

            // Use bind variables for safer insertion
            const insertSQL = `
                INSERT INTO WAREHOUSE (WarehouseSection, NumContainers, Capacity, PortAddress) 
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
                    PortAddress VARCHAR2(100),
                    PRIMARY KEY (Name),
                    FOREIGN KEY (Name) REFERENCES Country (Name) ON DELETE CASCADE
                )`);

            console.log('HOMECOUNTRY table created');

            // Insert initial data
            const insertStatements = [
                ['Canada', 38000000, 2.14, 'Liberal Party - Justin Trudeau', '999 Canada Pl, Vancouver, BC V6C 3T4'],
                ['USA', 331000000, 27.36, 'Democratic Party - Joe Biden', 'Signal St, San Pedro, CA 90731, United States'],
                ['China', 83000000, 17.79, 'Chinese Communist Party - Xi Jinping', 'Shengsi County, Zhoushan, China, 202461'],
                ['Japan', 125800000, 4.21, 'Liberal Democratic Party - Shigeru Ishiba', '4 - chōme - 8 Ariake, Koto City, Tokyo 135-0063, Japan'],
                ['Netherlands', 25600000, 1.12, 'Independent - Dick Schoof', 'Wilhelminakade 909, 3072 AP Rotterdam, Netherlands'],
                ['Russia', 146000000, 1680.0, 'United Russia - Vladimir Putin', '2, Mira St, Novorossiysk, Krasnodar Region 353900, Russia'],
                ['India', 1390000000, 2875.0, 'Bharatiya Janata Party - Narendra Modi', 'Port House Shoorji Vallabhdas Marg Mumbai, Maharastra 400 001, India'],
                ['Brazil', 213000000, 1505.0, 'Workers Party - Luiz Inácio Lula da Silva', 'Av. Conselheiro Rodrigues Alves, S/N - Porto Macuco, Santos - SP, 11015-900, Brazil']//,
                //['UK', 67000000, 3031.0, 'Conservative Party - Rishi Sunak', 'Immingham DN40 2LZ, United Kingdom']
            ];

            // Use bind variables for safer insertion
            const insertSQL = `
                INSERT INTO HOMECOUNTRY (Name, Population, GDP, Government, PortAddress) 
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

// async function insertHomeCountry(name, population, government, gdp, portaddress) {
//     return await withOracleDB(async (connection) => {
//         // Check if the entity exists in the COUNTRY table
//         const checkResult = await connection.execute(
//             `SELECT COUNT(*) AS COUNT
//              FROM COUNTRY
//              WHERE Name = :name`,
//             [name]
//         );
//
//         const exists = checkResult.rows[0].COUNT > 0;
//
//         if (!exists) {
//             throw new Error(`Entity '${name}' does not exist in the COUNTRY table.`);
//         }
//
//         // Insert into HOMECOUNTRY table
//         const result = await connection.execute(
//             `INSERT INTO HOMECOUNTRY (Name, Population, Government, GDP, PortAddress)
//              VALUES (:name, :population, :government, :gdp, :portaddress)`,
//             [name, population, government, gdp, portaddress],
//             {autoCommit: true}
//         );
//
//         // // Insert into FOREIGNCOUNTRY table
//         // const result2 = await connection.execute(
//         //     `INSERT INTO FOREIGNCOUNTRY (Name, Population, Government, GDP, DockingFee, PortAddress)
//         //      VALUES (:name, :population, :government, :gdp, :500.0, :portaddress)`,
//         //     [name, population, government, gdp, 500.0, portaddress],
//         //     {autoCommit: true}
//         // );
//
//         return result.rowsAffected && result.rowsAffected > 0;// && result2.rowsAffected && result2.rowsAffected > 0;
//     }).catch(() => {
//         return false;
//     });
// }
async function insertHomeCountry(name, population, government, gdp, portaddress) {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute(
            `INSERT INTO HOMECOUNTRY (name, population, government, gdp, PortAddress) 
             VALUES (:name, :population, :government, :gdp, :portaddress)`,
            [name, population, government, gdp, portaddress],
            { autoCommit: true }
        );

        const result2 = await connection.execute(
            `INSERT INTO FOREIGNCOUNTRY (name, population, government, gdp, PortAddress, DockingFee) 
             VALUES (:name, :population, :government, :gdp, :portaddress, 500.0)`,
            [name, population, government, gdp, portaddress],
            { autoCommit: true }
        );


        return result.rowsAffected > 0 && result2.rowsAffected > 0;
    }).catch(() => {
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
                    PortAddress VARCHAR2(100),
                    PRIMARY KEY (Name),
                    FOREIGN KEY (Name) REFERENCES Country (Name) ON DELETE CASCADE
                )`);

            console.log('FOREIGNCOUNTRY table created');

            // Insert initial data
            const insertStatements = [
                ['Canada', 38000000, 2.14, 'Liberal Party - Justin Trudeau', 500.0, '999 Canada Pl, Vancouver, BC V6C 3T4'],
                ['Russia', 146000000, 1680.0, 'United Russia - Vladimir Putin', 620.0, '2, Mira St, Novorossiysk, Krasnodar Region 353900, Russia'],
                ['India', 1390000000, 2875.0, 'Bharatiya Janata Party - Narendra Modi', 580.0, 'Port House Shoorji Vallabhdas Marg Mumbai, Maharastra 400 001, India'],
                ['Brazil', 213000000, 1505.0, 'Workers Party - Luiz Inácio Lula da Silva', 490.0, 'Av. Conselheiro Rodrigues Alves, S/N - Porto Macuco, Santos - SP, 11015-900, Brazil'],
                //['UK', 67000000, 3031.0, 'Conservative Party - Rishi Sunak', 550.0, 'Immingham DN40 2LZ, United Kingdom'],
                ['USA', 331000000, 27.36, 'Democratic Party - Joe Biden', 600.0, 'Signal St, San Pedro, CA 90731, United States'],
                ['China', 83000000, 17.79, 'Chinese Communist Party - Xi Jinping', 550.0, 'Shengsi County, Zhoushan, China, 202461'],
                ['Japan', 125800000, 4.21, 'Liberal Democratic Party - Shigeru Ishiba', 580.0, '4 - chōme - 8 Ariake, Koto City, Tokyo 135-0063, Japan'],
                ['Netherlands', 25600000, 1.12, 'Independent - Dick Schoof', 470.0, 'Wilhelminakade 909, 3072 AP Rotterdam, Netherlands']
            ];

            // Use bind variables for safer insertion
            const insertSQL = `
                INSERT INTO FOREIGNCOUNTRY (Name, Population, GDP, Government, DockingFee, PortAddress) 
                VALUES (:1, :2, :3, :4, :5, :6)`;

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

async function fetchTariffFromDb() {
    return await withOracleDB(async (connection) => {
        try {
            console.log('Executing SELECT query on TARIFF1 and TARIFF2 table...');
            const result = await connection.execute(
                `SELECT t1.TradeAgreement,
                        t1.TariffRate,
                        t1.HomeName,
                        t1.ForeignName,
                        t1.EnactmentDate,
                        t2.AffectedGoods 
                 FROM TARIFF1 t1
                 INNER JOIN TARIFF2 t2 
                    ON t1.EnactmentDate = t2.EnactmentDate
                    AND t1.TariffRate = t2.TariffRate
                    AND t1.HomeName = t2.HomeName
                    AND t1.ForeignName = t2.ForeignName`,
                [],
                { outFormat: oracledb.OUT_FORMAT_OBJECT }
            );
            console.log('Query result:', result);
            return result.rows;



        } catch (err) {
            console.error('Error fetching tariff data:', err);
            throw err;
        }
    }).catch((err) => {
        console.error('Error in fetchTariffFromDb:', err);
        return [];
    });
}

async function initiateTariff() {
    return await withOracleDB(async (connection) => {
        try {
            // First, try to find any foreign key constraints referencing TARIFF1 or TARIFF2
            const findFKsQuery = `
                SELECT table_name, constraint_name 
                FROM user_constraints 
                WHERE r_constraint_name IN (
                    SELECT constraint_name 
                    FROM user_constraints 
                    WHERE (table_name = 'TARIFF1' OR table_name = 'TARIFF2') 
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

            // Now try to drop the TARIFF tables
            try {
                await connection.execute('DROP TABLE TARIFF1 PURGE');
                console.log('Existing TARIFF1 table dropped');
            } catch (err) {
                console.log('Error dropping TARIFF1 table:', err.message);
            }

            try {
                await connection.execute('DROP TABLE TARIFF2 PURGE');
                console.log('Existing TARIFF2 table dropped');
            } catch (err) {
                console.log('Error dropping TARIFF2 table:', err.message);
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

            await connection.execute(`
                CREATE TABLE Tariff2
                (
                    TariffRate    FLOAT,
                    AffectedGoods VARCHAR2(100),
                    HomeName      VARCHAR2(100),
                    ForeignName   VARCHAR2(100),
                    EnactmentDate DATE,
                    PRIMARY KEY (EnactmentDate, TariffRate, HomeName, ForeignName),
                    FOREIGN KEY (ForeignName) REFERENCES ForeignCountry (Name) ON DELETE CASCADE, --ON UPDATE CASCADE,
                    FOREIGN KEY (HomeName) REFERENCES HomeCountry (Name) ON DELETE CASCADE --ON UPDATE CASCADE
                )`);

            console.log('TARIFF2 table created');


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

            const insertStatements2 = [
                [12,'Solar Panels','China','USA', new Date('2024-01-15')],
                [9,'Lumber','Canada','China', new Date('2024-10-25')],
                [8,'Maple Syrup','Canada','Netherlands', new Date('2020-06-12')],
                [5,'Oil','Canada','USA', new Date('2020-01-30')],
                [6,'Wheat','Canada','Japan', new Date('1998-04-09')]
        ];

            // Use bind variables for safer insertion
            const insertSQL2 = `
                INSERT INTO TARIFF2 (TariffRate, AffectedGoods, HomeName, ForeignName, EnactmentDate) 
                VALUES (:1, :2, :3, :4, :5)`;

            for (const data of insertStatements2) {
                await connection.execute(insertSQL2, data);
                console.log('Inserted data for:', data[0]);
            }

            await connection.commit();
            console.log('All data inserted and committed');
            return true;
        } catch (err) {
            console.error('Error in initiateTariff:', err);
            await connection.rollback();
            throw err;
        }
    }).catch((err) => {
        console.error('Failed to initiate tariff:', err);
        return false;
    });
}

async function fetchShippingRouteFromDb() {
    return await withOracleDB(async (connection) => {
        try {
            console.log('Executing SELECT query on SHIPPINGROUTE1 and SHIPPINGROUTE2 table...');
            const result = await connection.execute(
                `SELECT s1.OriginCountryName,
                        s1.TerminalCountryName,
                        s1.AnnualVolumeOfGoods,
                        s2.Name,
                        s2.Length
                 FROM SHIPPINGROUTE1 s1
                 INNER JOIN SHIPPINGROUTE2 s2 
                    ON s1.OriginCountryName = s2.OriginCountryName
                    AND s1.TerminalCountryName = s2.TerminalCountryName`,
                [],
                { outFormat: oracledb.OUT_FORMAT_OBJECT }
            );
            console.log('Query result:', result);
            return result.rows;



        } catch (err) {
            console.error('Error fetching shippingroute data:', err);
            throw err;
        }
    }).catch((err) => {
        console.error('Error in fetchShippingRouteFromDb:', err);
        return [];
    });
}

async function initiateShippingRoute() {
    return await withOracleDB(async (connection) => {
        try {
            // First, try to find any foreign key constraints referencing SHIPPINGROUTE1 or SHIPPINGROUTE2
            const findFKsQuery = `
                SELECT table_name, constraint_name 
                FROM user_constraints 
                WHERE r_constraint_name IN (
                    SELECT constraint_name 
                    FROM user_constraints 
                    WHERE (table_name = 'SHIPPINGROUTE1' OR table_name = 'SHIPPINGROUTE2') 
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

            // Now try to drop the TARIFF tables
            try {
                await connection.execute('DROP TABLE SHIPPINGROUTE1 PURGE');
                console.log('Existing SHIPPINGROUTE1 table dropped');
            } catch (err) {
                console.log('Error dropping SHIPPINGROUTE1 table:', err.message);
            }

            try {
                await connection.execute('DROP TABLE SHIPPINGROUTE2 PURGE');
                console.log('Existing SHIPPINGROUTE2 table dropped');
            } catch (err) {
                console.log('Error dropping SHIPPINGROUTE2 table:', err.message);
            }

            // Create the table
            await connection.execute(`
                CREATE TABLE ShippingRoute1
                (
                    AnnualVolumeOfGoods FLOAT,
                    OriginCountryName   VARCHAR2(100) NOT NULL,
                    TerminalCountryName VARCHAR2(100) NOT NULL,
                    PRIMARY KEY (OriginCountryName, TerminalCountryName),
                    FOREIGN KEY (OriginCountryName) REFERENCES ForeignCountry (Name) ON DELETE CASCADE, --ON UPDATE CASCADE,
                    FOREIGN KEY (TerminalCountryName) REFERENCES Country (Name) ON DELETE CASCADE       --ON UPDATE CASCADE
                )`);

            console.log('SHIPPINGROUTE1 table created');

            await connection.execute(`
                CREATE TABLE ShippingRoute2
                (
                    Name                VARCHAR2(100) NOT NULL,
                    Length              FLOAT,
                    OriginCountryName   VARCHAR2(100) NOT NULL,
                    TerminalCountryName VARCHAR2(100) NOT NULL,
                    PRIMARY KEY (Name),
                    FOREIGN KEY (OriginCountryName) REFERENCES ForeignCountry (Name)
                        ON DELETE CASCADE,
                    --ON UPDATE CASCADE,
                    FOREIGN KEY (TerminalCountryName) REFERENCES Country (Name) ON DELETE CASCADE --ON UPDATE CASCADE
                )`);

            console.log('SHIPPINGROUTE2 table created');


            // Insert initial data
            const insertStatements = [
                [12000,'Canada','USA'],
                [45000,'USA','Canada'],
                [80000,'China','Canada'],
                [20000,'Netherlands','Canada'],
                [60000,'Japan','Canada']
            ];

            // Use bind variables for safer insertion
            const insertSQL = `
                INSERT INTO SHIPPINGROUTE1 (AnnualVolumeOfGoods, OriginCountryName, TerminalCountryName) 
                VALUES (:1, :2, :3)`;

            for (const data of insertStatements) {
                await connection.execute(insertSQL, data);
                console.log('Inserted data for:', data[0]);
            }

            const insertStatements2 = [
                ['Great Circle', 4078,'Japan','Canada'],
                ['PANZ Seattle Loop', 1319, 'USA','Canada'],
                ['Trans - Pacific Route', 7838,'China','Canada'],
                ['Rotterdam - Vancouver', 11564,'Netherlands','Canada'],
                ['Toronto - Florida', 2343,'Canada','USA'],
            ];

            // Use bind variables for safer insertion
            const insertSQL2 = `
                INSERT INTO SHIPPINGROUTE2 (Name, Length, OriginCountryName, TerminalCountryName) 
                VALUES (:1, :2, :3, :4)`;

            for (const data of insertStatements2) {
                await connection.execute(insertSQL2, data);
                console.log('Inserted data for:', data[0]);
            }

            await connection.commit();
            console.log('All data inserted and committed');
            return true;
        } catch (err) {
            console.error('Error in initiateShippingRoute:', err);
            await connection.rollback();
            throw err;
        }
    }).catch((err) => {
        console.error('Failed to initiate shippingroute:', err);
        return false;
    });
}

async function fetchShipFromDb() {
    return await withOracleDB(async (connection) => {
        try {
            console.log('Executing SELECT query on SHIP1 and SHIP2 table...');
            const result = await connection.execute(
                `SELECT s1.Owner,
                        s1.ShipName,
                        s1.ShipSize,
                        s1.ShippingRouteName,
                        s1.DockedAtPortAddress,
                        s2.Capacity
                 FROM SHIP1 s1
                 INNER JOIN SHIP2 s2 
                    ON s1.ShipSize = s2.ShipSize`,
                [],
                { outFormat: oracledb.OUT_FORMAT_OBJECT }
            );
            console.log('Query result:', result);
            return result.rows;



        } catch (err) {
            console.error('Error fetching ship data:', err);
            throw err;
        }
    }).catch((err) => {
        console.error('Error in fetchShipFromDb:', err);
        return [];
    });
}

async function initiateShip() {
    return await withOracleDB(async (connection) => {
        try {
            // First, try to find any foreign key constraints referencing SHIP1 or SHIP2
            const findFKsQuery = `
                SELECT table_name, constraint_name 
                FROM user_constraints 
                WHERE r_constraint_name IN (
                    SELECT constraint_name 
                    FROM user_constraints 
                    WHERE (table_name = 'SHIP1' OR table_name = 'SHIP2') 
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

            // Now try to drop the SHIP tables
            try {
                await connection.execute('DROP TABLE SHIP1 PURGE');
                console.log('Existing SHIP1 table dropped');
            } catch (err) {
                console.log('Error dropping SHIP1 table:', err.message);
            }

            try {
                await connection.execute('DROP TABLE SHIP2 PURGE');
                console.log('Existing SHIP2 table dropped');
            } catch (err) {
                console.log('Error dropping SHIP2 table:', err.message);
            }

            // Create the table
            await connection.execute(`
                CREATE TABLE Ship1
                (
                    Owner               VARCHAR2(100) NOT NULL,
                    ShipName            VARCHAR2(100) NOT NULL,
                    ShipSize            FLOAT,
                    ShippingRouteName   VARCHAR2(100),
                    DockedAtPortAddress VARCHAR2(100),
                    --TotalGoodValue FLOAT,
                    PRIMARY KEY (Owner, ShipName),
                    FOREIGN KEY (ShippingRouteName) REFERENCES ShippingRoute2 (Name) ON DELETE CASCADE, -- ON UPDATE CASCADE,
                    FOREIGN KEY (DockedAtPortAddress) REFERENCES Port (PortAddress) ON DELETE CASCADE --ON UPDATE CASCADE
                )`);

            console.log('SHIP1 table created');

            await connection.execute(`
                CREATE TABLE Ship2
                (
                    ShipSize FLOAT NOT NULL,
                    Capacity FLOAT,
                    PRIMARY KEY (ShipSize)
                )`);

            console.log('SHIP2 table created');


            // Insert initial data
            const insertStatements = [
                ['Maersk', 'Ocean Breeze', 'Great Circle','999 Canada Pl, Vancouver, BC V6C 3T4', 100.5],
                ['Mediterranean Shipping Company', 'Seawolf', 'PANZ Seattle Loop', 'Shengsi County, Zhoushan, China, 202461', 150.75],
                ['Atlantic Trade', 'Blue Horizon','Trans - Pacific Route', 'Wilhelminakade 909, 3072 AP Rotterdam, Netherlands', 200.0],
                ['Pacific Vessels', 'Tidal Wave', 'Rotterdam - Vancouver', 'Signal St, San Pedro, CA 90731, United States', 175.4],
                ['Maritime Enterprises', 'Northern Star', 'PANZ Seattle Loop', '4 - chōme - 8 Ariake, Koto City, Tokyo 135-0063, Japan', 225.6]
        ];

            // Use bind variables for safer insertion
            const insertSQL = `
                INSERT INTO SHIP1 (Owner, ShipName, ShippingRouteName, DockedAtPortAddress, ShipSize) 
                VALUES (:1, :2, :3, :4, :5)`;

            for (const data of insertStatements) {
                await connection.execute(insertSQL, data);
                console.log('Inserted data for:', data[0]);
            }

            const insertStatements2 = [
                [100.5, 500.0],
                [150.75, 800.0],
                [200.0, 1200.0],
                [175.4, 950.0],
                [225.6, 1400.0]
            ];

            // Use bind variables for safer insertion
            const insertSQL2 = `
                INSERT INTO SHIP2 (ShipSize, Capacity) 
                VALUES (:1, :2)`;

            for (const data of insertStatements2) {
                await connection.execute(insertSQL2, data);
                console.log('Inserted data for:', data[0]);
            }

            await connection.commit();
            console.log('All data inserted and committed');
            return true;
        } catch (err) {
            console.error('Error in initiateShip:', err);
            await connection.rollback();
            throw err;
        }
    }).catch((err) => {
        console.error('Failed to initiate ship:', err);
        return false;
    });
}

async function fetchCompanyFromDb() {
    return await withOracleDB(async (connection) => {
        try {
            console.log('Executing SELECT query on COMPANY table...');
            const result = await connection.execute(
                `SELECT * FROM COMPANY`,
                [],
                { outFormat: oracledb.OUT_FORMAT_OBJECT }
            );
            console.log('Query result:', result);
            return result.rows;



        } catch (err) {
            console.error('Error fetching company data:', err);
            throw err;
        }
    }).catch((err) => {
        console.error('Error in fetchCompanyFromDb:', err);
        return [];
    });
}

async function initiateCompany() {
    return await withOracleDB(async (connection) => {
        try {
            // First, try to find any foreign key constraints referencing SHIP1 or SHIP2
            const findFKsQuery = `
                SELECT table_name, constraint_name 
                FROM user_constraints 
                WHERE r_constraint_name IN (
                    SELECT constraint_name 
                    FROM user_constraints 
                    WHERE (table_name = 'COMPANY') 
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

            // Now try to drop the COMPANY table
            try {
                await connection.execute('DROP TABLE COMPANY PURGE');
                console.log('Existing COMPANY table dropped');
            } catch (err) {
                console.log('Error dropping COMPANY table:', err.message);
            }

            // Create the table
            await connection.execute(`
                CREATE TABLE Company
                (
                    CEO           VARCHAR2(100) NOT NULL,
                    Name          VARCHAR2(100) NOT NULL,
                    Industry      VARCHAR2(100),
                    YearlyRevenue FLOAT,
                    CountryName   VARCHAR2(100) NOT NULL,
                    PRIMARY KEY (CEO, Name),
                    FOREIGN KEY (CountryName) REFERENCES Country (Name) ON DELETE CASCADE -- ON UPDATE CASCADE
                )`);

            console.log('COMPANY table created');


            // Insert initial data
            const insertStatements = [
                ['Wang Chuanfu', 'BYD Auto', 'Automotive', 112000.0, 'USA'],
                ['Elliot Hill', 'Nike', 'Sportswear', 37200.0, 'USA'],
                ['Kevin Plank', 'UnderArmour', 'Sportswear', 5000.0, 'USA'],
                ['Christophe Fouquet', 'ASML Holdings', 'Technology', 29800.0, 'Netherlands'],
                ['Shuntaro Furakawa', 'Nintendo', 'Entertainment', 14000.0, 'Japan'],
                ['Mark Bristow', 'Berrick Gold', 'Mining', 11400.0, 'Canada']
            ];

            // Use bind variables for safer insertion
            const insertSQL = `
                INSERT INTO COMPANY (CEO, Name, Industry, YearlyRevenue, CountryName) 
                VALUES (:1, :2, :3, :4, :5)`;

            for (const data of insertStatements) {
                await connection.execute(insertSQL, data);
                console.log('Inserted data for:', data[0]);
            }

            await connection.commit();
            console.log('All data inserted and committed');
            return true;
        } catch (err) {
            console.error('Error in initiateCompany:', err);
            await connection.rollback();
            throw err;
        }
    }).catch((err) => {
        console.error('Failed to initiate company:', err);
        return false;
    });
}

async function fetchShipmentContainerFromDb() {
    return await withOracleDB(async (connection) => {
        try {
            console.log('Executing SELECT query on SHIPMENTCONTAINER1 and SHIPMENTCONTAINER2 table...');
            const result = await connection.execute(
                `SELECT s2.ShipOwner,
                        s2.ShipName,
                        s2.GoodType,
                        s2.GoodValue,
                        s2.ContainerSize,
                        s2.Weight,
                        s2.TrackingNumber,
                        s2.TradeAgreement,
                        s2.CompanyName,
                        s2.CompanyCEO,
                        s1.PortAddress,
                        s1.WarehouseSection
                 FROM SHIPMENTCONTAINER1 s1
                 INNER JOIN SHIPMENTCONTAINER2 s2 
                    ON s1.ShipOwner = s2.ShipOwner
                    AND s1.ShipName = s2.ShipName`,
                [],
                { outFormat: oracledb.OUT_FORMAT_OBJECT }
            );
            console.log('Query result:', result);
            return result.rows;



        } catch (err) {
            console.error('Error fetching shipmentcontainer data:', err);
            throw err;
        }
    }).catch((err) => {
        console.error('Error in fetchShipmentContainerFromDb:', err);
        return [];
    });
}

async function initiateShipmentContainer() {
    return await withOracleDB(async (connection) => {
        try {
            // First, try to find any foreign key constraints referencing SHIPMENTCONTAINER1 or SHIPMENTCONTAINER2
            const findFKsQuery = `
                SELECT table_name, constraint_name 
                FROM user_constraints 
                WHERE r_constraint_name IN (
                    SELECT constraint_name 
                    FROM user_constraints 
                    WHERE (table_name = 'SHIPMENTCONTAINER1' OR table_name = 'SHIPMENTCONTAINER2') 
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

            // Now try to drop the SHIPMENTCONTAINER tables
            try {
                await connection.execute('DROP TABLE SHIPMENTCONTAINER1 PURGE');
                console.log('Existing SHIPMENTCONTAINER1 table dropped');
            } catch (err) {
                console.log('Error dropping SHIPMENTCONTAINER1 table:', err.message);
            }

            try {
                await connection.execute('DROP TABLE SHIPMENTCONTAINER2 PURGE');
                console.log('Existing SHIPMENTCONTAINER2 table dropped');
            } catch (err) {
                console.log('Error dropping SHIPMENTCONTAINER2 table:', err.message);
            }

            // Create the table
            await connection.execute(`
                CREATE TABLE ShipmentContainer1
                (
                    ShipOwner        VARCHAR2(100) NOT NULL,
                    ShipName         VARCHAR2(100) NOT NULL,
                    PortAddress      VARCHAR2(100) NOT NULL,
                    WarehouseSection NUMBER,
                    PRIMARY KEY (ShipOwner, ShipName),
                    FOREIGN KEY (ShipOwner, ShipName) REFERENCES Ship1 (Owner, ShipName) ON DELETE CASCADE, -- ON UPDATE CASCADE,
                    FOREIGN KEY (PortAddress) REFERENCES Port (PortAddress) ON DELETE CASCADE, -- ON UPDATE CASCADE,
                    FOREIGN KEY (PortAddress, WarehouseSection) REFERENCES Warehouse (PortAddress, WarehouseSection) ON DELETE CASCADE --ON UPDATE CASCADE
                )`);

            console.log('SHIPMENTCONTAINER1 table created');

            await connection.execute(`
                CREATE TABLE ShipmentContainer2
                (
                    ShipOwner      VARCHAR2(100),
                    ShipName       VARCHAR2(100),
                    GoodType       VARCHAR2(100),
                    GoodValue      FLOAT,
                    ContainerSize  FLOAT,
                    Weight         FLOAT,
                    TrackingNumber INTEGER NOT NULL,
                    TradeAgreement VARCHAR2(100),
                    CompanyName    VARCHAR2(100),
                    CompanyCEO     VARCHAR2(100),
                    PRIMARY KEY (TrackingNumber),
                    FOREIGN KEY (ShipOwner, ShipName) REFERENCES Ship1 (Owner, ShipName) ON DELETE CASCADE, -- ON UPDATE CASCADE,
                    --FOREIGN KEY (TrackingNumber) REFERENCES ShipmentContainer1 (TrackingNumber) ON DELETE CASCADE ON UPDATE CASCADE,
                    FOREIGN KEY (TradeAgreement) REFERENCES Tariff1 (TradeAgreement) ON DELETE CASCADE, -- ON UPDATE CASCADE,
                    FOREIGN KEY (CompanyName, CompanyCEO) REFERENCES Company (Name, CEO) ON DELETE CASCADE -- ON UPDATE CASCADE
                )`);

            console.log('SHIPMENTCONTAINER2 table created');


            // Insert initial data
            const insertStatements = [
                ['Maersk', 'Ocean Breeze', '999 Canada Pl, Vancouver, BC V6C 3T4', 1],
                ['Mediterranean Shipping Company', 'Seawolf', 'Shengsi County, Zhoushan, China, 202461', 2],
                ['Atlantic Trade', 'Blue Horizon', 'Wilhelminakade 909, 3072 AP Rotterdam, Netherlands', 3],
                ['Pacific Vessels', 'Tidal Wave', 'Signal St, San Pedro, CA 90731, United States', 4],
                ['Maritime Enterprises', 'Northern Star', '4 - chōme - 8 Ariake, Koto City, Tokyo 135-0063, Japan', 9]
            ];

            // Use bind variables for safer insertion
            const insertSQL = `
                INSERT INTO SHIPMENTCONTAINER1 (ShipOwner, ShipName, PortAddress, WarehouseSection) 
                VALUES (:1, :2, :3, :4)`;

            for (const data of insertStatements) {
                await connection.execute(insertSQL, data);
                console.log('Inserted data for:', data[0]);
            }

            const insertStatements2 = [
                ['Maersk', 'Ocean Breeze', 'Automotive', 2000000,45.0, 300.0, 1001, 'China - USA Agreement', 'BYD Auto',
                    'Wang Chuanfu'],
                ['Mediterranean Shipping Company', 'Seawolf', 'Mining', 1300000,50.0, 450.0, 1002, 'Canada - China Agreement', 'Berrick Gold',
                'Mark Bristow'],
                ['Atlantic Trade', 'Blue Horizon', 'Sportswear', 600000,30.0, 200.0, 1003, 'Canada - Netherlands Agreement',
                'Nike', 'Elliot Hill'],
                ['Pacific Vessels', 'Tidal Wave', 'Sportswear', 400000,60.0, 500.0, 1004, 'Canada - USA Agreement', 'UnderArmour',
                'Kevin Plank'],
                ['Maritime Enterprises', 'Northern Star', 'Entertainment', 700000,55.0, 400.0, 1005, 'Canada - Japan Agreement',
                'Nintendo', 'Shuntaro Furakawa']
            ];

            // Use bind variables for safer insertion
            const insertSQL2 = `
                INSERT INTO SHIPMENTCONTAINER2 (ShipOwner, ShipName, GoodType, GoodValue, ContainerSize, Weight, TrackingNumber, TradeAgreement, CompanyName, CompanyCEO) 
                VALUES (:1, :2, :3, :4, :5, :6, :7, :8, :9, :10)`;

            for (const data of insertStatements2) {
                await connection.execute(insertSQL2, data);
                console.log('Inserted data for:', data[0]);
            }

            await connection.commit();
            console.log('All data inserted and committed');
            return true;
        } catch (err) {
            console.error('Error in initiateShipmentContainer:', err);
            await connection.rollback();
            throw err;
        }
    }).catch((err) => {
        console.error('Failed to initiate shipmentcontainer:', err);
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
           [addy],
            { autoCommit: true }
        );

        // await connection.execute(`
        //             UPDATE Ship1
        //             SET DockedAtPortAddress = 'International Waters.'
        //             WHERE DockedAtPortAddress =:addy
        //     `,
        //     [addy],
        //     { autoCommit: true }
        // );
        //
        // await connection.execute(`
        //             DELETE FROM Ship1 WHERE DockedAtPortAddress =:addy
        //          `,
        //     [addy],
        //     { autoCommit: true }
        // );

        await connection.execute( `
                    UPDATE Country
                    SET PortAddress = 'No ports from this country are currently monitored.'
                    WHERE PortAddress =:addy
            `,
            [addy],
            { autoCommit: true }
        );


        const deletion = await connection.execute( `
        DELETE FROM Port WHERE PortAddress =:addy
        `,
            [addy]
        );

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
            console.error("Error deleting Ship:", error);
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
            console.error("Error deleting Tariff:", error);
            return false;
        });

}
//aggregation with having
async function portsNumShips(num) {
    return await withOracleDB(async (connection) =>  {
        const res = await connection.execute(`
            CREATE TABLE shipPorts AS
            (SELECT DockedAtPortAddress, COUNT(ShipName) AS NumShips
            FROM Ship1
            GROUP BY DockedAtPortAddress
            HAVING COUNT(ShipName) >=:num)
        `,
            [num],
            {autoCommit: true}
        );
        console.log('Query result:', res);
        return true;
    })
        .catch((error) => {
            console.error("Error finding ports with numships:", error);
            return false;
        });
}

//group by
async function maxAvgContainer() {
    return await withOracleDB(async (connection) =>  {
        const result = await connection.execute(`
            SELECT ShipName, MAX(avg_value) AS max_avg
            FROM (
                     SELECT s1.ShipName, AVG(s2.GoodValue) AS avg_value
                     FROM Ship1 s1
                              JOIN ShipmentContainer2 s2
                                   ON s1.ShipName = s2.ShipName
                     GROUP BY s1.ShipName
                 )
            GROUP BY ShipName
        `);

        console.log('result table for max created.');


        if (result.rows && result.rows.length > 0) {
            const maxResult = result.rows[0];
            return {
                shipName: maxResult[0],
                maxAvg: maxResult[1],
            };
        }

        throw new Error("No averages found/No rows affected.");
    })
        .catch((error) => {
            console.error("Error finding the max of averages", error);
            return false;
        });
}

//helper for updating the
async function updateShipValues() {
    return await withOracleDB(async (connection) => {
        await connection.execute(`
        UPDATE Ship1
        SET value = (
            SELECT SUM(s2.goodvalue)
            FROM ShipmentContainer2 s2
            WHERE Ship.Owner = s2.ShipOwner AND Ship.Name = s2.ShipName
        `,
        { autoCommit: true }
        );
    })
        .catch((error) => {
            console.error("Error finding", error);
            return false;
        });
}

// assigns shipment container to warehouse, increments warehouse numContainers
async function addShipmentContainer(shipOwner, shipName, portAddress, section) {
    const wSection = await withOracleDB(async (connection) => {
                             await connection.execute(`
                             SELECT Section
                             FROM Warehouse
                             WHERE PortAddress = portAddress AND Section = section
                             `,
                             {portAddress, section},
                             { autoCommit: true }
                             );
                         })

    if (!wSection.rows || wSection.rows.length <= 0) {
                    return false;
                }

    await withOracleDB(async (connection) => {
            await connection.execute(`
            UPDATE ShipmentContainer1
            SET WarehouseSection = wSection
            WHERE ShipOwner = shipOwner AND ShipName = shipName
            `,
            {shipOwner, shipName, wSection},
            { autoCommit: true }
            );
        })
            .catch((error) => {
                console.error("Warehouse at max capacity", error);
                return false;
            });

    return await updateNumContainers(portAddress, section, 1);
}

// removes shipment container from warehouse, decrements warehouse numContainers
async function removeShipmentContainer(shipOwner, shipName, portAddress, section) {
    await withOracleDB(async (connection) => {
            await connection.execute(`
            UPDATE ShipmentContainer1
            SET WarehouseSection = NULL
            WHERE ShipOwner = shipOwner AND ShipName = shipName
            `,
            {shipOwner, shipName},
            { autoCommit: true }
            );
        })
            .catch((error) => {
                console.error("Warehouse at max capacity", error);
                return false;
            });

    return await updateNumContainers(portAddress, section, -1);
}

//increments or decrements Warehouse numContainers
async function updateNumContainers(portAddress, section, n) {
    const result = await withOracleDB(async (connection) => {
                        await connection.execute(`
                        SELECT NumContainers, Capacity
                        FROM Warehouse
                        WHERE PortAddress = portAddress AND Section = section
                        `,
                        {portAddress, section},
                        { autoCommit: true }
                        );
                    })

    if (!result.rows || result.rows.length <= 0) {
                return false;
            }

    const rowResult = result.rows[0];
    const num = rowResult[0];
    const capacity = rowResult[1];

    if (num + n > capacity && num + n < 0) {
        throw new CapacityError();
    }

    return await withOracleDB(async (connection) => {
        await connection.execute(`
        UPDATE Warehouse
        SET NumContainers = num
        WHERE PortAddress = portAddress AND Section = section
        `,
        {portAddress, section, num: num + n},
        { autoCommit: true }
        );
    })
        .catch((error) => {
            console.error("Warehouse at max capacity", error);
            return false;
        });
}

class CapacityError extends Error {
}

module.exports = {
    testOracleConnection,
    initiateAll,

    fetchCountryFromDb,
    initiateCountry,

    fetchPortFromDb,
    initiatePort,

    fetchWarehouseFromDb,
    initiateWarehouse,

    fetchHomeCountryFromDb,
    insertHomeCountry,
    initiateHomeCountry,


    fetchForeignCountryFromDb,
    initiateForeignCountry,

    fetchTariffFromDb,
    initiateTariff,

    fetchShippingRouteFromDb,
    initiateShippingRoute,

    fetchShipFromDb,
    initiateShip,

    fetchCompanyFromDb,
    initiateCompany,

    fetchShipmentContainerFromDb,
    initiateShipmentContainer,

    maxAvgContainer,
    updateShipValues,
    fetchNumShipsFromDB,

    insertCountry,
    //updateNameCountry,
    updateCountry,
    countCountry,

    shipToPort,
    portsNumShips,

    deleteCompany,
    deleteShippingRoute,
    deleteShip,
    deletePort,
    deleteTariff,
    deleteWarehouse,

    addShipmentContainer,
    removeShipmentContainer,
    updateNumContainers,

    CapacityError
};

//!!TODO
//------------------REQUIRED------------------
//-X-INSERT (implement on HOMECOUNTRY)
//  -> specify what values to insert
//  -> affects more than one relationship
//  -> handle the case where the foreign key value in the tuple being inserted does not exist in the relation that is being referred to
//      -> user notification - rejection
//UPDATE
//  -> relation must have at least 2 non-primary-key attributes
//  -> At least one non-primary key attribute must have either a UNIQUE constraint or be a foreign key that references another relation.
//  -> display the tuples that are available for the relation so the user can select which tuple they want to update (just show table? probably)
//      -> UPDATECOUNTRYNAME -- need to update all things that reference country MANUALLY
//-X- DELETE (implemented on PORT and cascades to related tables)
//  -> cascade-on-delete situation
//-X- AGGREGATION with GROUP BY (count implemented on COUNTRY)
//  -> e.g., min, max, average, or count
//  -> must provide an interface (e.g., button, dropdown, etc.)
//-X- NESTED AGGREGATION WITH GROUP BY
//  -> must find some aggregated value for each group
//  -> must provide an interface (e.g., button, dropdown, etc.)
//  -> can use VIEW if easier
//  -> see pdf for example

//DIVISION
//  -> must do division (no shit)
//  -> must provide an interface (e.g., button, dropdown, etc.)
//SELECT -- Search through all attributes --- SHIP
//  -> search for tuples using any number of AND/OR clauses and combinations of attributes.
//  -> using a dynamically generated dropdown of AND/OR options or parsing user string
//PROJECTION -- Choose which attributes to view on this table --- PORT (using buttons on frontend)
//  -> The user can choose any number of attributes to view from this relation
//  -> Non-selected attributes must not appear in the result
//JOIN -- Find all shipments from a specific COMPANY
//  -> join at least two relations
//  -> user must provide at least one value to qualify in the WHERE clause
//AGGREGATION WITH HAVING — Find and return all PORT with a certain (user-inputted?) number of ships
//  -> must include a HAVING clause.
//  -> must provide an interface (e.g., button, dropdown, etc.)



//------------------OTHER REQUIREMENTS------------------
//-X-NOT ALL ON ONE PAGE
//-X-sufficient user data?
// basic security practices
//  -> values from the user are not directly used in the database
//  -> prevent injection and rainbow attacks
// basic error handling
//  -> user errors such as trying to insert a duplicate value, invalid input (e.g., invalid characters or an int when only strings are allowed)
// user notification
//  -> The user will receive a success or failure notification upon the completion of an insert,
//      update, delete action and will have a way to verify the action's effect on the database.
//ADD MILESTONE 4 PDF
//  -> cover page
//  -> description of what we accomplished
//  -> what we changed compared to final schema
//      -> destination country instead of destination port in shipping route
//      -> ISA relationship is not disjoint, it is inclusive
//      -> added unique constraint to country government
//  -> A list of all SQL queries used to satisfy the rubric items and where each query can
//      be found in the code (file name and line number(s)).
//  -> For SQL queries 2.1.7 through 2.1.10 inclusive, include a copy of your SQL query
//      and a maximum of 1-2 sentences describing what that query does. You can embed
//      this in your above list of queries.
// Cite the work that we used from the demo




//------------------NICE-TO-HAVES------------------
//MAKE IT LOOK NOT ASS
//TAB ICON
