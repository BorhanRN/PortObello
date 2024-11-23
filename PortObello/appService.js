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

//sets Ship.PortAddress to the DestinationAddress of ship.ShippingRoute
async function shipToPort(Owner, ShipName) {
    return await  withOracleDB( async (connection) => {
        const shipUpdate = await connection.execute(
            `UPDATE Ship1 h 
             SET DockedAtPortAddress = (
                 SELECT s.DestinationAddress
                 FROM ShippingRoute2 s
                 JOIN Ship1 h2
                 ON s.Name = h2.ShippingRoute
                 WHERE h2.Owner =:Owner AND h2.ShipName =: ShipName
                 )
             WHERE Owner= :Owner AND ShipName= :ShipName`,
            [Owner, ShipName],
        )


        if (shipUpdate.rowsAffected === 0) {
            throw new Error("Ship update failed: No rows affected.");
        }

        const portUpdate = await connection.execute(
            `UPDATE Port p 
             SET NumDockedShips = (NumDockedShips+1
                 )
             WHERE PortAddress= (                 
                         SELECT s.DestinationAddress
                         FROM ShippingRoute2 s
                         JOIN Ship1 h2
                         ON s.Name = h2.ShippingRoute
                         WHERE h2.Owner =:Owner AND h2.ShipName =: ShipName)`,
            [Owner, ShipName],
        )
        if (portUpdate.rowsAffected === 0) {
            throw new Error("Port update failed: No rows affected.");
        }

        // Commit both updates
        await connection.commit();

        return true; // Both updates succeeded
    }).catch((error) => {
        console.error("Error updating ship's port:", error);
        return false; // Return false if an error occurs
    });

}


module.exports = {
    testOracleConnection,

    fetchCountryFromDb,
    initiateCountry,

    fetchWarehouseFromDb,
    initiateWarehouse,

    fetchPortFromDb,
    initiatePort,

    insertCountry,
    updateNameCountry,
    countCountry
};