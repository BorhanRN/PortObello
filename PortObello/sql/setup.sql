-- noinspection SqlNoDataSourceInspectionForFile

-- reset tables
-- Drop tables in reverse order of creation
DROP TABLE ShipmentContainer2 CASCADE CONSTRAINTS;
DROP TABLE ShipmentContainer1 CASCADE CONSTRAINTS;
DROP TABLE Ship2 CASCADE CONSTRAINTS;
DROP TABLE Ship1 CASCADE CONSTRAINTS;
DROP TABLE ShippingRoute2 CASCADE CONSTRAINTS;
DROP TABLE ShippingRoute1 CASCADE CONSTRAINTS;
DROP TABLE Tariff2 CASCADE CONSTRAINTS;
DROP TABLE Tariff1 CASCADE CONSTRAINTS;
DROP TABLE Warehouse CASCADE CONSTRAINTS;
DROP TABLE Company CASCADE CONSTRAINTS;
DROP TABLE Port CASCADE CONSTRAINTS;
DROP TABLE ForeignCountry CASCADE CONSTRAINTS;
DROP TABLE HomeCountry CASCADE CONSTRAINTS;
DROP TABLE Country CASCADE CONSTRAINTS;


-- Table Creation
CREATE TABLE Country
(
    Name        VARCHAR2(100) NOT NULL,
    Population  NUMBER,
    Government  VARCHAR2(100),
    PortAddress VARCHAR2(200) NOT NULL,
    GDP         NUMBER,
    PRIMARY KEY (Name)
);

CREATE TABLE Port
(
    PortAddress VARCHAR2(200) NOT NULL,
    NumWorkers  NUMBER,
    DockedShips NUMBER,
    CountryName VARCHAR2(100),
    PRIMARY KEY (PortAddress),
    FOREIGN KEY (CountryName) REFERENCES Country (Name) ON DELETE CASCADE
);

CREATE TABLE Warehouse
(
    PortAddress   VARCHAR2(200) NOT NULL,
    WarehouseSection       NUMBER,
    NumContainers NUMBER,
    Capacity      NUMBER,
    PRIMARY KEY (PortAddress, WarehouseSection),
    FOREIGN KEY (PortAddress) REFERENCES Port (PortAddress) ON DELETE CASCADE
);

CREATE TABLE HomeCountry
(
    Name       VARCHAR2(100) NOT NULL,
    Population NUMBER,
    GDP        FLOAT,
    Government VARCHAR2(100),
    DockingFee FLOAT,
    PRIMARY KEY (Name),
    FOREIGN KEY (Name) REFERENCES Country (Name) ON DELETE CASCADE
);

CREATE TABLE ForeignCountry
(
    Name       VARCHAR2(100) NOT NULL,
    Population NUMBER,
    GDP        FLOAT,
    Government VARCHAR2(100),
    DockingFee FLOAT,
    PRIMARY KEY (Name),
    FOREIGN KEY (Name) REFERENCES Country (Name) ON DELETE CASCADE
);

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
);

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
);

CREATE TABLE ShippingRoute1
(
    AnnualVolumeOfGoods FLOAT,
    OriginCountryName	VARCHAR2(100) NOT NULL,
    TerminalCountryName VARCHAR2(100) NOT NULL,
    PRIMARY KEY (OriginCountryName, TerminalCountryName),
    FOREIGN KEY (OriginCountryName) REFERENCES ForeignCountry (Name) ON DELETE CASCADE, --ON UPDATE CASCADE,
    FOREIGN KEY (TerminalCountryName) REFERENCES Country (Name) ON DELETE CASCADE --ON UPDATE CASCADE
);


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
);

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
);

CREATE TABLE Ship2
(
    ShipSize FLOAT NOT NULL,
    Capacity FLOAT,
    PRIMARY KEY (ShipSize)
);

CREATE TABLE Company
(
    CEO           VARCHAR2(100) NOT NULL,
    Name          VARCHAR2(100) NOT NULL,
    Industry      VARCHAR2(100),
    YearlyRevenue FLOAT,
    CountryName   VARCHAR2(100) NOT NULL,
    PRIMARY KEY (CEO, Name),
    FOREIGN KEY (CountryName) REFERENCES Country (Name) ON DELETE CASCADE -- ON UPDATE CASCADE
);

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
);

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
);




-- Insert Statements
INSERT INTO Country (Name, Population, Government, PortAddress, GDP)
VALUES ('Canada', 38930000, 'Liberal Party - Justin Trudeau', '999 Canada Pl, Vancouver, BC V6C 3T4', 2.14);
INSERT INTO Country (Name, Population, Government, PortAddress, GDP)
VALUES ('USA', 333300000, 'Democratic Party - Joe Biden', 'Signal St, San Pedro, CA 90731, United States', 27.36);
INSERT INTO Country (Name, Population, Government, PortAddress, GDP)
VALUES ('China', 1412000000, 'Chinese Communist Party - Xi Jinping', 'Shengsi County, Zhoushan, China, 202461', 17.79);
INSERT INTO Country (Name, Population, Government, PortAddress, GDP)
VALUES ('Japan', 125100000, 'Liberal Democratic Party - Shigeru Ishiba', '4 - chōme - 8 Ariake, Koto City, Tokyo 135-0063, Japan', 4.21);
INSERT INTO Country (Name, Population, Government, PortAddress, GDP)
VALUES ('Netherlands', 177000000, 'Independent - Dick Schoof', 'Wilhelminakade 909, 3072 AP Rotterdam, Netherlands', 1.12);
INSERT INTO Country (Name, Population, Government, PortAddress, GDP)
VALUES ('Russia', 146000000, 'United Russia - Vladimir Putin', 'xxx', 1680.0);
INSERT INTO Country (Name, Population, Government, PortAddress, GDP)
VALUES ('India', 1390000000, 'Bharatiya Janata Party - Narendra Modi', 'yyy', 2875.0);
INSERT INTO Country (Name, Population, Government, PortAddress, GDP)
VALUES ('Brazil', 213000000, 'Workers Party - Luiz Inácio Lula da Silva', 'zzz', 1505.0);
INSERT INTO Country (Name, Population, Government, PortAddress, GDP)
VALUES ('UK', 67000000, 'Conservative Party - Rishi Sunak', 'xyz', 3031.0);


INSERT INTO Port (PortAddress, NumWorkers, DockedShips, CountryName)
VALUES ('999 Canada Pl, Vancouver, BC V6C 3T4', 523, 53, 'Canada');
INSERT INTO Port (PortAddress, NumWorkers, DockedShips, CountryName)
VALUES ('Shengsi County, Zhoushan, China, 202461', 13546, 123,'China');
INSERT INTO Port (PortAddress, NumWorkers, DockedShips, CountryName)
VALUES ('Wilhelminakade 909, 3072 AP Rotterdam, Netherlands', 1270, 225,'Netherlands');
INSERT INTO Port (PortAddress, NumWorkers, DockedShips, CountryName)
VALUES ('Signal St, San Pedro, CA 90731, United States', 1230, 67,'USA');
INSERT INTO Port (PortAddress, NumWorkers, DockedShips, CountryName)
VALUES ('4 - chōme - 8 Ariake, Koto City, Tokyo 135-0063, Japan', 30000, 44,'Japan');


INSERT INTO HomeCountry (Name, Population, GDP, Government, DockingFee)
VALUES ('Canada', 38000000, 2.14, 'Liberal Party - Justin Trudeau', 500.0);
INSERT INTO HomeCountry (Name, Population, GDP, Government, DockingFee)
VALUES ('USA', 331000000, 27.36, 'Democratic Party - Joe Biden', 600.0);
INSERT INTO HomeCountry (Name, Population, GDP, Government, DockingFee)
VALUES ('China', 83000000, 17.79, 'Chinese Communist Party - Xi Jinping', 550.0);
INSERT INTO HomeCountry (Name, Population, GDP, Government, DockingFee)
VALUES ('Japan', 125800000, 4.21, 'Liberal Democratic Party - Shigeru Ishiba', 580.0);
INSERT INTO HomeCountry (Name, Population, GDP, Government, DockingFee)
VALUES ('Netherlands', 25600000, 1.12, 'Independent - Dick Schoof', 470.0);
INSERT INTO HomeCountry (Name, Population, GDP, Government, DockingFee)
VALUES ('Russia', 146000000, 1680.0, 'United Russia - Vladimir Putin', 620.0);
INSERT INTO HomeCountry (Name, Population, GDP, Government, DockingFee)
VALUES ('India', 1390000000, 2875.0, 'Bharatiya Janata Party - Narendra Modi', 580.0);
INSERT INTO HomeCountry (Name, Population, GDP, Government, DockingFee)
VALUES ('Brazil', 213000000, 1505.0, 'Workers Party - Luiz Inácio Lula da Silva', 490.0);
INSERT INTO HomeCountry (Name, Population, GDP, Government, DockingFee)
VALUES ('UK', 67000000, 3031.0, 'Conservative Party - Rishi Sunak', 550.0);

INSERT INTO ForeignCountry (Name, Population, GDP, Government, DockingFee)
VALUES ('Canada', 38000000, 2.14, 'Liberal Party - Justin Trudeau', 500.0);
INSERT INTO ForeignCountry (Name, Population, GDP, Government, DockingFee)
VALUES ('Russia', 146000000, 1680.0, 'United Russia - Vladimir Putin', 620.0);
INSERT INTO ForeignCountry (Name, Population, GDP, Government, DockingFee)
VALUES ('India', 1390000000, 2875.0, 'Bharatiya Janata Party - Narendra Modi', 580.0);
INSERT INTO ForeignCountry (Name, Population, GDP, Government, DockingFee)
VALUES ('Brazil', 213000000, 1505.0, 'Workers Party - Luiz Inácio Lula da Silva', 490.0);
INSERT INTO ForeignCountry (Name, Population, GDP, Government, DockingFee)
VALUES ('UK', 67000000, 3031.0, 'Conservative Party - Rishi Sunak', 550.0);
INSERT INTO ForeignCountry (Name, Population, GDP, Government, DockingFee)
VALUES ('USA', 331000000, 27.36, 'Democratic Party - Joe Biden', 600.0);
INSERT INTO ForeignCountry (Name, Population, GDP, Government, DockingFee)
VALUES ('China', 83000000, 17.79, 'Chinese Communist Party - Xi Jinping', 550.0);
INSERT INTO ForeignCountry (Name, Population, GDP, Government, DockingFee)
VALUES ('Japan', 125800000, 4.21, 'Liberal Democratic Party - Shigeru Ishiba', 580.0);
INSERT INTO ForeignCountry (Name, Population, GDP, Government, DockingFee)
VALUES ('Netherlands', 25600000, 1.12, 'Independent - Dick Schoof', 470.0);


INSERT INTO Warehouse (WarehouseSection, NumContainers, Capacity, PortAddress)
VALUES (1, 90, 100,'999 Canada Pl, Vancouver, BC V6C 3T4');
INSERT INTO Warehouse (WarehouseSection, NumContainers, Capacity, PortAddress)
VALUES (2, 200, 300,'Shengsi County, Zhoushan, China, 202461');
INSERT INTO Warehouse (WarehouseSection, NumContainers, Capacity, PortAddress)
VALUES (3, 200, 200,'Wilhelminakade 909, 3072 AP Rotterdam, Netherlands');
INSERT INTO Warehouse (WarehouseSection, NumContainers, Capacity, PortAddress)
VALUES (4, 631, 1000,'Signal St, San Pedro, CA 90731, United States');
INSERT INTO Warehouse (WarehouseSection, NumContainers, Capacity, PortAddress)
VALUES (9, 10, 220,'4 - chōme - 8 Ariake, Koto City, Tokyo 135-0063, Japan');


INSERT INTO Tariff1 (TradeAgreement, TariffRate, HomeName, ForeignName, EnactmentDate)
VALUES ('China - USA Agreement', 12,'China','USA', TO_DATE('2024-01-15', 'YYYY-MM-DD'));
INSERT INTO Tariff1 (TradeAgreement, TariffRate, HomeName, ForeignName, EnactmentDate)
VALUES ('Canada - China Agreement', 9,'Canada','China', TO_DATE('2024-10-25', 'YYYY-MM-DD'));
INSERT INTO Tariff1 (TradeAgreement, TariffRate, HomeName, ForeignName, EnactmentDate)
VALUES ('Canada - Netherlands Agreement', 8,'Canada','Netherlands', TO_DATE('2020-06-12', 'YYYY-MM-DD'));
INSERT INTO Tariff1 (TradeAgreement, TariffRate, HomeName, ForeignName, EnactmentDate)
VALUES ('Canada - USA Agreement', 5,'Canada','USA', TO_DATE('2020-01-30', 'YYYY-MM-DD'));
INSERT INTO Tariff1 (TradeAgreement, TariffRate, HomeName, ForeignName, EnactmentDate)
VALUES ('Canada - Japan Agreement', 6,'Canada','Japan', TO_DATE('1998-04-09', 'YYYY-MM-DD'));


INSERT INTO Tariff2 (TariffRate, AffectedGoods, HomeName, ForeignName, EnactmentDate)
VALUES (12,'Solar Panels','China','USA', TO_DATE('2024-01-15', 'YYYY-MM-DD'));
INSERT INTO Tariff2 (TariffRate, AffectedGoods, HomeName, ForeignName, EnactmentDate)
VALUES (9,'Lumber','Canada','China', TO_DATE('2024-10-25', 'YYYY-MM-DD'));
INSERT INTO Tariff2 (TariffRate, AffectedGoods, HomeName, ForeignName, EnactmentDate)
VALUES (8,'Maple Syrup','Canada','Netherlands', TO_DATE('2020-06-12', 'YYYY-MM-DD'));
INSERT INTO Tariff2 (TariffRate, AffectedGoods, HomeName, ForeignName, EnactmentDate)
VALUES (5,'Oil','Canada','USA', TO_DATE('2020-01-30', 'YYYY-MM-DD'));
INSERT INTO Tariff2 (TariffRate, AffectedGoods, HomeName, ForeignName, EnactmentDate)
VALUES (6,'Wheat','Canada','Japan', TO_DATE('1998-04-09', 'YYYY-MM-DD'));



INSERT INTO ShippingRoute1 (AnnualVolumeOfGoods, OriginCountryName, TerminalCountryName)
VALUES (12000,'Canada','USA');
INSERT INTO ShippingRoute1 (AnnualVolumeOfGoods, OriginCountryName, TerminalCountryName)
VALUES (45000,'USA','Canada');
INSERT INTO ShippingRoute1 (AnnualVolumeOfGoods, OriginCountryName, TerminalCountryName)
VALUES (80000,'China','Canada');
INSERT INTO ShippingRoute1 (AnnualVolumeOfGoods, OriginCountryName, TerminalCountryName)
VALUES (20000,'Netherlands','Canada');
INSERT INTO ShippingRoute1 (AnnualVolumeOfGoods, OriginCountryName, TerminalCountryName)
VALUES (60000,'Japan','Canada');


INSERT INTO ShippingRoute2 (Name, Length, OriginCountryName, TerminalCountryName)
VALUES ('Great Circle', 4078,'Japan','Canada');
INSERT INTO ShippingRoute2 (Name, Length, OriginCountryName, TerminalCountryName)
VALUES ('PANZ Seattle Loop', 1319, 'USA','Canada');
INSERT INTO ShippingRoute2 (Name, Length, OriginCountryName, TerminalCountryName)
VALUES ('Trans - Pacific Route', 7838,'China','Canada');
INSERT INTO ShippingRoute2 (Name, Length, OriginCountryName, TerminalCountryName)
VALUES ('Rotterdam - Vancouver', 11564,'Netherlands','Canada');
INSERT INTO ShippingRoute2 (Name, Length, OriginCountryName, TerminalCountryName)
VALUES ('Toronto - Florida', 2343,'Canada','USA');

INSERT INTO Ship1 (Owner, ShipName, ShippingRouteName, DockedAtPortAddress, ShipSize)
VALUES ('Maersk', 'Ocean Breeze', 'Great Circle','999 Canada Pl, Vancouver, BC V6C 3T4', 100.5);
INSERT INTO Ship1 (Owner, ShipName, ShippingRouteName, DockedAtPortAddress, ShipSize)
VALUES ('Mediterranean Shipping Company', 'Seawolf', 'PANZ Seattle Loop', 'Shengsi County, Zhoushan, China, 202461', 150.75);
INSERT INTO Ship1 (Owner, ShipName, ShippingRouteName, DockedAtPortAddress, ShipSize)
VALUES ('Atlantic Trade', 'Blue Horizon','Trans - Pacific Route', 'Wilhelminakade 909, 3072 AP Rotterdam, Netherlands', 200.0);
INSERT INTO Ship1 (Owner, ShipName, ShippingRouteName, DockedAtPortAddress, ShipSize)
VALUES ('Pacific Vessels', 'Tidal Wave', 'Rotterdam - Vancouver', 'Signal St, San Pedro, CA 90731, United States', 175.4);
INSERT INTO Ship1 (Owner, ShipName, ShippingRouteName, DockedAtPortAddress, ShipSize)
VALUES ('Maritime Enterprises', 'Northern Star', 'PANZ Seattle Loop', '4 - chōme - 8 Ariake, Koto City, Tokyo 135-0063, Japan', 225.6);


-- IMPLEMENTATION WITH SUM OF GOOD VALUE
-- INSERT INTO Ship1 (Owner, ShipName, ShippingRouteName, DockedAtPortAddress, ShipSize, TotalGoodValue)
-- VALUES (
--            'Maersk',
--            'Ocean Breeze',
--            'Great Circle',
--            '999 Canada Pl, Vancouver, BC V6C 3T4',
--            100.5,
--            (SELECT SUM s.GoodValue
--             FROM ShipmentContainer2 s
--             WHERE s.Owner = 'Maersk' AND s.ShipName = 'Ocean Breeze'
--            )
--        );
-- INSERT INTO Ship1 (Owner, ShipName, ShippingRouteName, DockedAtPortAddress, ShipSize, TotalGoodValue)
-- VALUES (
--            'Mediterranean Shipping Company',
--            'Seawolf',
--            'PANZ Seattle Loop',
--            'Shengsi County, Zhoushan, China, 202461',
--            150.75,
--            (SELECT SUM(s.GoodValue)
--             FROM ShipmentContainer2 s
--             WHERE s.Owner = 'Mediterranean Shipping Company' AND s.ShipName = 'Seawolf'
--            )
--        );
-- INSERT INTO Ship1 (Owner, ShipName, ShippingRouteName, DockedAtPortAddress, ShipSize, TotalGoodValue)
-- VALUES (
--            'Atlantic Trade',
--            'Blue Horizon',
--            'Trans - Pacific Route',
--            'Wilhelminakade 909, 3072 AP Rotterdam, Netherlands',
--            200.0,
--            (SELECT SUM(s.GoodValue)
--             FROM ShipmentContainer2 s
--             WHERE s.Owner = 'Atlantic Trade' AND s.ShipName = 'Blue Horizon'
--            )
--        );
-- INSERT INTO Ship1 (Owner, ShipName, ShippingRouteName, DockedAtPortAddress, ShipSize, TotalGoodValue)
-- VALUES (
--            'Pacific Vessels',
--            'Tidal Wave',
--            'Rotterdam - Vancouver',
--            'Signal St, San Pedro, CA 90731, United States',
--            175.4,
--            (SELECT SUM s.GoodValue
--             FROM ShipmentContainer2 s
--             WHERE s.Owner = 'Pacific Vessels' AND s.ShipName = 'Tidal Wave'
--            )
--        );
-- INSERT INTO Ship1 (Owner, ShipName, ShippingRouteName, DockedAtPortAddress, ShipSize, TotalGoodValue)
-- VALUES (
--            'Maritime Enterprises',
--            'Northern Star',
--            'PANZ Seattle Loop',
--            '4 - chōme - 8 Ariake, Koto City, Tokyo 135-0063, Japan',
--            225.6,
--            (SELECT SUM s.GoodValue
--             FROM ShipmentContainer2 s
--             WHERE s.Owner = 'Maritime Enterprises' AND s.ShipName = 'Northern Star'
--            )
--        );


INSERT INTO Ship2 (ShipSize, Capacity)
VALUES (100.5, 500.0);
INSERT INTO Ship2 (ShipSize, Capacity)
VALUES (150.75, 800.0);
INSERT INTO Ship2 (ShipSize, Capacity)
VALUES (200.0, 1200.0);
INSERT INTO Ship2 (ShipSize, Capacity)
VALUES (175.4, 950.0);
INSERT INTO Ship2 (ShipSize, Capacity)
VALUES (225.6, 1400.0);

INSERT INTO Company (CEO, Name, Industry, YearlyRevenue, CountryName)
VALUES ('Wang Chuanfu', 'BYD Auto', 'Automotive', 112000.0, 'USA');
INSERT INTO Company (CEO, Name, Industry, YearlyRevenue, CountryName)
VALUES ('Elliot Hill', 'Nike', 'Sportswear', 37200.0, 'USA');
INSERT INTO Company (CEO, Name, Industry, YearlyRevenue, CountryName)
VALUES ('Kevin Plank', 'UnderArmour', 'Sportswear', 5000.0, 'USA');
INSERT INTO Company (CEO, Name, Industry, YearlyRevenue, CountryName)
VALUES ('Christophe Fouquet', 'ASML Holdings', 'Technology', 29800.0, 'Netherlands');
INSERT INTO Company (CEO, Name, Industry, YearlyRevenue, CountryName)
VALUES ('Shuntaro Furakawa', 'Nintendo', 'Entertainment', 14000.0, 'Japan');
INSERT INTO Company (CEO, Name, Industry, YearlyRevenue, CountryName)
VALUES ('Mark Bristow', 'Berrick Gold', 'Mining', 11400.0, 'Canada');

INSERT INTO ShipmentContainer1 (ShipOwner, ShipName, PortAddress, WarehouseSection)
VALUES ('Maersk', 'Ocean Breeze', '999 Canada Pl, Vancouver, BC V6C 3T4', 1);
INSERT INTO ShipmentContainer1 (ShipOwner, ShipName, PortAddress, WarehouseSection)
VALUES ('Mediterranean Shipping Company', 'Seawolf', 'Shengsi County, Zhoushan, China, 202461', 2);
INSERT INTO ShipmentContainer1 (ShipOwner, ShipName, PortAddress, WarehouseSection)
VALUES ('Atlantic Trade', 'Blue Horizon', 'Wilhelminakade 909, 3072 AP Rotterdam, Netherlands', 3);
INSERT INTO ShipmentContainer1 (ShipOwner, ShipName, PortAddress, WarehouseSection)
VALUES ('Pacific Vessels', 'Tidal Wave', 'Signal St, San Pedro, CA 90731, United States', 4);
INSERT INTO ShipmentContainer1 (ShipOwner, ShipName, PortAddress, WarehouseSection)
VALUES ('Maritime Enterprises', 'Northern Star', '4 - chōme - 8 Ariake, Koto City, Tokyo 135-0063, Japan', 9);


INSERT INTO ShipmentContainer2 (ShipOwner, ShipName, GoodType, GoodValue, ContainerSize, Weight, TrackingNumber, TradeAgreement, CompanyName, CompanyCEO)
VALUES ('Maersk', 'Ocean Breeze', 'Automotive', 2000000,45.0, 300.0, 1001, 'China - USA Agreement', 'BYD Auto',
        'Wang Chuanfu');
INSERT INTO ShipmentContainer2 (ShipOwner, ShipName, GoodType, GoodValue, ContainerSize, Weight, TrackingNumber, TradeAgreement, CompanyName, CompanyCEO)
VALUES ('Mediterranean Shipping Company', 'Seawolf', 'Mining', 1300000,50.0, 450.0, 1002, 'Canada - China Agreement', 'Berrick Gold',
        'Mark Bristow');
INSERT INTO ShipmentContainer2 (ShipOwner, ShipName, GoodType, GoodValue, ContainerSize, Weight, TrackingNumber, TradeAgreement, CompanyName, CompanyCEO)
VALUES ('Atlantic Trade', 'Blue Horizon', 'Sportswear', 600000,30.0, 200.0, 1003, 'Canada - Netherlands Agreement',
        'Nike', 'Elliot Hill');
INSERT INTO ShipmentContainer2 (ShipOwner, ShipName, GoodType, GoodValue, ContainerSize, Weight, TrackingNumber, TradeAgreement, CompanyName, CompanyCEO)
VALUES ('Pacific Vessels', 'Tidal Wave', 'Sportswear', 400000,60.0, 500.0, 1004, 'Canada - USA Agreement', 'UnderArmour',
        'Kevin Plank');
INSERT INTO ShipmentContainer2 (ShipOwner, ShipName, GoodType, GoodValue, ContainerSize, Weight, TrackingNumber, TradeAgreement, CompanyName, CompanyCEO)
VALUES ('Maritime Enterprises', 'Northern Star', 'Entertainment', 700000,55.0, 400.0, 1005, 'Canada - Japan Agreement',
        'Nintendo', 'Shuntaro Furakawa');