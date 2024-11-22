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

// async function fetchCountryFromDb() {
//     return await withOracleDB(async (connection) => {
//         const result = await connection.execute('SELECT * FROM COUNTRY');
//         console.log('Query result:', result.rows);
//         return result.rows;
//     }).catch(() => {
//         return [];
//     });
// }

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

// OG
// async function initiateCountry() {
//     return await withOracleDB(async (connection) => {
//         try {
//             // await connection.execute(`DROP TABLE COUNTRY`);
//             await connection.execute('SELECT * FROM COUNTRY');
//         } catch(err) {
//             console.log('Table might not exist, proceeding to create...');
//         }
//
//     //     const result = await connection.execute(`
//     //      CREATE TABLE Country
//     //         (
//     //             Name        VARCHAR2(100) NOT NULL,
//     //             Population  NUMBER,
//     //             Government  VARCHAR2(100),
//     //             PortAddress VARCHAR2(200) NOT NULL,
//     //             GDP         NUMBER,
//     //             PRIMARY KEY (Name)
//     //         );
//     //
//     //         INSERT INTO Country (Name, Population, Government, PortAddress, GDP)
//     //         VALUES ('Canada', 38930000, 'Liberal Party - Justin Trudeau', '999 Canada Pl, Vancouver, BC V6C 3T4', 2.14);
//     //         INSERT INTO Country (Name, Population, Government, PortAddress, GDP)
//     //         VALUES ('USA', 333300000, 'Democratic Party - Joe Biden', 'Signal St, San Pedro, CA 90731, United States', 27.36);
//     //         INSERT INTO Country (Name, Population, Government, PortAddress, GDP)
//     //         VALUES ('China', 1412000000, 'Chinese Communist Party - Xi Jinping', 'Shengsi County, Zhoushan, China, 202461', 17.79);
//     //         INSERT INTO Country (Name, Population, Government, PortAddress, GDP)
//     //         VALUES ('Japan', 125100000, 'Liberal Democratic Party - Shigeru Ishiba', '4 - chōme - 8 Ariake, Koto City, Tokyo 135-0063, Japan', 4.21);
//     //         INSERT INTO Country (Name, Population, Government, PortAddress, GDP)
//     //         VALUES ('Netherlands', 177000000, 'Independent - Dick Schoof', 'Wilhelminakade 909, 3072 AP Rotterdam, Netherlands', 1.12);
//     //         INSERT INTO Country (Name, Population, Government, PortAddress, GDP)
//     //         VALUES ('Russia', 146000000, 'United Russia - Vladimir Putin', 'xxx', 1680.0);
//     //         INSERT INTO Country (Name, Population, Government, PortAddress, GDP)
//     //         VALUES ('India', 1390000000, 'Bharatiya Janata Party - Narendra Modi', 'yyy', 2875.0);
//     //         INSERT INTO Country (Name, Population, Government, PortAddress, GDP)
//     //         VALUES ('Brazil', 213000000, 'Workers Party - Luiz Inácio Lula da Silva', 'zzz', 1505.0);
//     //         INSERT INTO Country (Name, Population, Government, PortAddress, GDP)
//     //         VALUES ('UK', 67000000, 'Conservative Party - Rishi Sunak', 'xyz', 3031.0);
//     //
//     //
//     //     `);
//     //
//     //
//     //     console.log("Table creation and data insertion result:", result);
//     //     return true;
//     // }).catch((err) => {
//     //     console.error("Error during table creation or data insertion:", err);
//     //     return false;
//      });
// }

// CL1
// async function initiateCountry() {
//     return await withOracleDB(async (connection) => {
//         try {
//             // First try to drop the existing table
//             try {
//                 await connection.execute('DROP TABLE COUNTRY');
//                 console.log('Existing COUNTRY table dropped');
//             } catch (err) {
//                 console.log('Table might not exist, proceeding to create...', err.message);
//             }
//
//             // Create the table
//             await connection.execute(`
//                 CREATE TABLE Country (
//                     Name        VARCHAR2(100) NOT NULL,
//                     Population  NUMBER,
//                     Government  VARCHAR2(100),
//                     PortAddress VARCHAR2(200) NOT NULL,
//                     GDP         NUMBER,
//                     PRIMARY KEY (Name)
//                 )`);
//
//             console.log('COUNTRY table created');
//
//             // Insert initial data
//             const insertStatements = [
//                 `INSERT INTO Country (Name, Population, Government, PortAddress, GDP)
//                  VALUES ('Canada', 38930000, 'Liberal Party - Justin Trudeau', '999 Canada Pl, Vancouver, BC V6C 3T4', 2.14)`,
//                 `INSERT INTO Country (Name, Population, Government, PortAddress, GDP)
//                  VALUES ('USA', 333300000, 'Democratic Party - Joe Biden', 'Signal St, San Pedro, CA 90731, United States', 27.36)`,
//                 `INSERT INTO Country (Name, Population, Government, PortAddress, GDP)
//                  VALUES ('China', 1412000000, 'Chinese Communist Party - Xi Jinping', 'Shengsi County, Zhoushan, China, 202461', 17.79)`,
//                 `INSERT INTO Country (Name, Population, Government, PortAddress, GDP)
//                  VALUES ('Japan', 125100000, 'Liberal Democratic Party - Shigeru Ishiba', '4 - chōme - 8 Ariake, Koto City, Tokyo 135-0063, Japan', 4.21)`,
//                 `INSERT INTO Country (Name, Population, Government, PortAddress, GDP)
//                  VALUES ('Netherlands', 177000000, 'Independent - Dick Schoof', 'Wilhelminakade 909, 3072 AP Rotterdam, Netherlands', 1.12)`
//             ];
//
//             for (const statement of insertStatements) {
//                 await connection.execute(statement);
//                 console.log('Executed:', statement);
//             }
//
//             await connection.commit();
//             console.log('All data inserted and committed');
//             return true;
//         } catch (err) {
//             console.error('Error in initiateCountry:', err);
//             return false;
//         }
//     });
// }

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
                    PortAddress VARCHAR2(200) NOT NULL,
                    GDP         NUMBER,
                    PRIMARY KEY (Name)
                )`);

            console.log('COUNTRY table created');

            // Insert initial data
            const insertStatements = [
                ['Canada', 38930000, 'Liberal Party - Justin Trudeau', '999 Canada Pl, Vancouver, BC V6C 3T4', 2.14],
                ['USA', 333300000, 'Democratic Party - Joe Biden', 'Signal St, San Pedro, CA 90731, United States', 27.36],
                ['China', 1412000000, 'Chinese Communist Party - Xi Jinping', 'Shengsi County, Zhoushan, China, 202461', 17.79],
                ['Japan', 125100000, 'Liberal Democratic Party - Shigeru Ishiba', '4 - chōme - 8 Ariake, Koto City, Tokyo 135-0063, Japan', 4.21],
                ['Netherlands', 177000000, 'Independent - Dick Schoof', 'Wilhelminakade 909, 3072 AP Rotterdam, Netherlands', 1.12]
            ];

            // Use bind variables for safer insertion
            const insertSQL = `
                INSERT INTO COUNTRY (Name, Population, Government, PortAddress, GDP) 
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

async function insertCountry(name, population, government, portaddress, gdp) {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute(
            `INSERT INTO COUNTRY (name, population, government, portaddress, gdp) VALUES (:name, :population, :government, :portaddress, :gdp)`,
            [name, population, government, portaddress, gdp],
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

//sets Ship.PortAddress to the DestinationAddress of ship.ShippingRoute
async function shipToPort(Owner, ShipName) {
    return await  withOracleDB( async (connection) => {
        const result = await connection.execute(
            `UPDATE SHIPS 
             SET PortAddress = (
                 SELECT DestinationAddress
                 FROM ShippingRoute2 s, SHIPS h
                 WHERE s.Name = h.ShippingRoute
                 )
             WHERE Owner=:Owner & ShipName=:ShipName:`,
        )

        return result.rowsAffected && result.rowsAffected > 0;
    }).catch((error) => {
        console.error("Error updating ship's port:", error);
        return false; // Return false if an error occurs
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

module.exports = {
    testOracleConnection,
    fetchCountryFromDb,
    initiateCountry,
    insertCountry,
    updateNameCountry,
    countCountry
};