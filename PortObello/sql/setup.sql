-- noinspection SqlNoDataSourceInspectionForFile

-- Table Creation
CREATE TABLE Country
(
    Name        VARCHAR UNIQUE,
    Population  INT,
    Government  VARCHAR,
    PortAddress VARCHAR NOT NULL,
    PRIMARY KEY (Name),
    FOREIGN KEY (PortAddress) REFERENCES
        Port (Address),
    ON DELETE CASCADE,
    ON UPDATE CASCADE
);

CREATE TABLE Warehouse
(
    PortAddress   VARCHAR NOT NULL,
    Section       INT,
    NumContainers INT,
    Capacity      INT,
    PRIMARY KEY (PortAddress, Section),
    UNIQUE (PortAddress),
    FOREIGN KEY (PortAddress) REFERENCES
        Port (Address),
    ON DELETE CASCADE,
    ON UPDATE CASCADE
);

CREATE TABLE Port
(
    Address     VARCHAR NOT NULL,
    NumWorkers  INT,
    DockedShips INT,
    CountryName VARCHAR UNIQUE,
    PRIMARY KEY (Address),
    FOREIGN KEY (CountryName) REFERENCES
        Country (Name),
    ON DELETE CASCADE,
    ON UPDATE CASCADE
);

CREATE TABLE Tariff1
(
    TradeAgreement VARCHAR NOT NULL,
    TariffRate     FLOAT,
    HomeName       VARCHAR,
    ForeignName    VARCHAR,
    EnactmentDate  DATE,
    PRIMARY KEY (TradeAgreement),
    FOREIGN KEY (ForeignName) REFERENCES
        ForeignCountry (Name),
    ON DELETE CASCADE,
    ON UPDATE CASCADE,
    FOREIGN KEY (HomeName) REFERENCES
        HomeCountry (Name),
    ON DELETE CASCADE,
    ON UPDATE CASCADE
);

CREATE TABLE Tariff2
(
    TariffRate    FLOAT,
    AffectedGoods VARCHAR,
    HomeName      VARCHAR,
    ForeignName   VARCHAR,
    EnactmentDate DATE,
    PRIMARY KEY (EnactmentDate, TariffRate, HomeName, ForeignName),
    FOREIGN KEY (ForeignName) REFERENCES
        ForeignCountry (Name),
    ON DELETE CASCADE,
    ON UPDATE CASCADE,
    FOREIGN KEY (HomeName) REFERENCES
        HomeCountry (Name),
    ON DELETE CASCADE,
    ON UPDATE CASCADE
);

CREATE TABLE ShippingRoute1
(
    AnnualVolumeOfGoods FLOAT OriginCountryName	    VARCHAR NOT NULL,
    TerminalPortAddress VARCHAR NOT NULL,
    PRIMARY KEY (OriginCountryName, TerminalPortAddress),
    FOREIGN KEY (OriginCountryName) REFERENCES
        ForeignCountry (Name),
    ON DELETE CASCADE,
    ON UPDATE CASCADE,
    FOREIGN KEY (TerminalPortAddress) REFERENCES
        Port (Address),
    ON DELETE CASCADE,
    ON UPDATE CASCADE
);


CREATE TABLE ShippingRoute2
(
    Name                VARCHAR UNIQUE NOT NULL,
    Length              FLOAT,
    OriginCountryName   VARCHAR        NOT NULL,
    TerminalPortAddress VARCHAR        NOT NULL,
    PRIMARY KEY (Name),
    FOREIGN KEY (OriginCountryName) REFERENCES
        ForeignCountry (Name),
    ON DELETE CASCADE,
    ON UPDATE CASCADE,
    FOREIGN KEY (TerminalPortAddress) REFERENCES
        Port (Address),
    ON DELETE CASCADE,
    ON UPDATE CASCADE
);



CREATE TABLE Ship1
(
    Owner               VARCHAR NOT NULL,
    ShipName            VARCHAR NOT NULL,
    ShippingRouteName   VARCHAR,
    DockedAtPortAddress VARCHAR,
    PRIMARY KEY (Owner, ShipName),
    FOREIGN KEY (ShippingRouteName) REFERENCES ShippingRoute (ShippingRouteName),
    ON DELETE CASCADE,
    ON UPDATE CASCADE,
    FOREIGN KEY (DockedAtPortAddress) REFERENCES Port (Address),
    ON DELETE CASCADE,
    ON UPDATE CASCADE
);

CREATE TABLE Ship2
(
    ShipSize FLOAT NOT NULL,
    Capacity FLOAT,
    PRIMARY KEY (ShipSize),
    ON DELETE CASCADE,
    ON UPDATE CASCADE
);

CREATE TABLE HomeCountry
(
    Name       VARCHAR NOT NULL UNIQUE,
    Population INTEGER,
    GDP        FLOAT,
    Government VARCHAR,
    DockingFee FLOAT,
    PRIMARY KEY (Name),
    FOREIGN KEY (Name) REFERENCES Country (Name),
    ON DELETE CASCADE,
    ON UPDATE CASCADE
);

CREATE TABLE ForeignCountry
(
    Name       VARCHAR NOT NULL UNIQUE,
    Population INTEGER,
    GDP        FLOAT,
    Government VARCHAR,
    DockingFee FLOAT,
    PRIMARY KEY (Name),
    FOREIGN KEY (Name) REFERENCES Country (Name),
    ON DELETE CASCADE,
    ON UPDATE CASCADE
);

CREATE TABLE ShipmentContainer1
(
    ShipOwner        VARCHAR NOT NULL,
    ShipName         VARCHAR NOT NULL,
    PortAddress      VARCHAR UNIQUE,
    WarehouseSection INTEGER,
    PRIMARY KEY (ShipOwner, ShipName),
    FOREIGN KEY (ShipOwner, ShipName) REFERENCES Ship (Owner, ShipName),
    ON DELETE CASCADE,
    ON UPDATE CASCADE,
    FOREIGN KEY (PortAddress) REFERENCES Port (Address),
    ON DELETE CASCADE,
    ON UPDATE CASCADE,
    FOREIGN KEY (WarehouseSection) REFERENCES Warehouse (WarehouseSection),
    ON DELETE CASCADE,
    ON UPDATE CASCADE
);

CREATE TABLE ShipmentContainer2
(
    ShipOwner      VARCHAR,
    ShipName       VARCHAR,
    GoodType       VARCHAR,
    ContainerSize  FLOAT,
    Weight         FLOAT,
    TrackingNumber INTEGER NOT NULL,
    TradeAgreement VARCHAR,
    CompanyName    VARCHAR,
    CompanyCEO     VARCHAR,
    PRIMARY KEY (TrackingNumber),
    FOREIGN KEY (ShipOwner, ShipName) REFERENCES
        Ship (Owner, ShipName),
    ON DELETE CASCADE,
    ON UPDATE CASCADE,
    FOREIGN KEY (TrackingNumber) REFERENCES
        ShipmentContainer1 (TrackingNumber),
    ON DELETE CASCADE,
    ON UPDATE CASCADE,
    FOREIGN KEY (TradeAgreement) REFERENCES
        Tariff (TradeAgreement),
    ON DELETE CASCADE,
    ON UPDATE CASCADE,
    FOREIGN KEY (CompanyName, CompanyCEO) REFERENCES
        Company (Name, CEO),
    ON DELETE CASCADE,
    ON UPDATE CASCADE
);

CREATE TABLE Company
(
    CEO           VARCHAR NOT NULL,
    Name          VARCHAR NOT NULL,
    Industry      VARCHAR,
    YearlyRevenue FLOAT,
    CountryName   VARCHAR,
    PRIMARY KEY (CEO, Name),
    FOREIGN KEY (CountryName) REFERENCES Country (Name),
    ON DELETE CASCADE,
    ON UPDATE CASCADE
);


-- Insert Statements
INSERT INTO Country
    (Name, Population, Government, GDP, PortAddress)
VALUES ('Canad', 38930000, 'Liberal Party - Justin Trudea', '999 Canada Pl, Vancouver, BC V6C 3T'),
       ('United State', 333300000, 'Democratic Party - Joe Bide', 'Signal St, San Pedro, CA 90731, United State'),
       ('Chin', 1412000000, 'Chinese Communist Party - Xi Jinpin', 'Shengsi County, Zhoushan, China, 20246'),
       ('Japa', 125100000, 'Liberal Democratic Party - Shigeru Ishib', '4 - chōme - 8 Ariake, Koto City,
         Tokyo 135-0063, Japa'),
       ('Netherland', 177000000, 'Independant - Dick Schoo', 'Wilhelminakade 909, 3072 AP Rotterdam, Netherland');


INSERT INTO Warehouse
    (Section, NumContainers, Capacity, PortAddress)
VALUES (1, 90, 100,
        '999 Canada Pl, Vancouver, BC V6C 3T4'),
       (2, 200, 300,
        '999 Canada Pl, Vancouver, BC V6C 3T4'),
       (3, 200, 200,
        '999 Canada Pl, Vancouver, BC V6C 3T4'),
       (1, 631, 1000,
        'Shengsi County, Zhoushan, China, 202461'),
       (9, 10, 220,
        'Wilhelminakade 909, 3072 AP Rotterdam, Netherlands');


INSERT INTO Port
    (PortAddress, NumWorkers, DockedShips, CountryName)
VALUES ('999 Canada Pl, Vancouver, BC V6C 3T4', 523, 53,
        'Canada'),
       ('Shengsi County, Zhoushan, China, 202461', 13546, 123,
        'China'),
       ('Wilhelminakade 909, 3072 AP Rotterdam, Netherlands', 1270, 225,
        'Netherlands'),
       ('Signal St, San Pedro, CA 90731, United States', 1230, 67,
        'United States'),
       ('4 - chōme - 8 Ariake, Koto City, Tokyo 135-0063, Japan', 30000, 44,
        'Japan');



INSERT INTO Tariff1
    (TradeAgreement, TariffRate, HomeName, ForeignName, EnactmentDate)
VALUES ('China - USA Agreement', 12,
        'China',
        'USA', 2024 - 01 - 15),
       ('Canada - China Agreement', 9,
        'Canada',
        'China', 2020 - 10 - 25),
       ('Canada - Netherlands Agreement', 8,
        'Canada',
        'Netherlands', 2008 - 06 - 12),
       ('Canada - USA Agreement', 5,
        'Canada',
        'USA', 2020 - 01 - 30),
       ('Canada - Japan Agreement', 6,
        'Canada',
        'Japan', 1998 - 04 - 09);


INSERT INTO Tariff2
    (TariffRate, AffectedGoods, HomeName, ForeignName, EnactmentDate)
VALUES (12,
        'Solar Panels',
        'China',
        'USA', 2024 - 01 - 15),
       (9,
        'Lumber',
        'Canada',
        'China', 2020 - 10 - 25),
       (8,
        'Maple Syrup',
        'Canada',
        'Netherlands', 2008 - 06 - 12),
       (5,
        'Oil',
        'Canada',
        'USA', 2020 - 01 - 30),
       (6,
        'Wheat',
        'Canada',
        'Japan', 1998 - 04 - 09);



INSERT INTO ShippingRoute1
    (AnnualVolumeOfGoods, OriginCountryName, TerminalPortAddress)
VALUES (12000,
        'Canada',
        'Signal St, San Pedro, CA 90731, United States'),
       (45000,
        'United States',
        '999 Canada Pl, Vancouver, BC V6C 3T4'),
       (80000,
        'China',
        '999 Canada Pl, Vancouver, BC V6C 3T4'),
       (20000,
        'Netherlands',
        '999 Canada Pl, Vancouver, BC V6C 3T4'),
       (60000,
        'Japan',
        '999 Canada Pl, Vancouver, BC V6C 3T4');


INSERT INTO ShippingRoute2
    (Name, Length, OriginCountryName, TerminalPortAddress)
VALUES ('Great Circle', 4078,
        'Japan',
        '999 Canada Pl, Vancouver, BC V6C 3T4'),
       ('PANZ Seattle Loop', 1319 'United States',
        '999 Canada Pl, Vancouver, BC V6C 3T4'),
       ('Trans - Pacific Route', 7838,
        'China',
        '999 Canada Pl, Vancouver, BC V6C 3T4'),
       ('Rotterdam - Vancouver', 11564,
        'Netherlands',
        '999 Canada Pl, Vancouver, BC V6C 3T4'),
       ('PANZ Seattle Loop', 1319,
        'Canada',
        'Signal St, San Pedro, CA 90731, United States');



INSERT INTO Ship1
    (Owner, ShipName, ShippingRouteName, DockedAtPortAddress)
VALUES ('Maersk', 'Ocean Breeze',
        'Great Circle',
        '999 Canada Pl, Vancouver, BC V6C 3T4'),
       ('Mediterranean Shipping Company', 'Seawolf', 'PANZ Seattle Loop',
        'Shengsi County, Zhoushan, China, 202461'),
       ('Atlantic Trade', 'Blue Horizon',
        'Trans - Pacific Route', 'Wilhelminakade 909, 3072 AP Rotterdam, Netherlands'),
       (' Pacific Vessels', 'Tidal Wave', 'Rotterdam-Vancouver', 'Signal St, San Pedro, CA 90731, United States'),
       ('Maritime Enterprises', 'Northern Star',
        'PANZ Seattle Loop', '4 - chōme - 8 Ariake, Koto City, Tokyo 135-0063, Japan');


INSERT INTO Ship2
    (ShipSize, Capacity)
VALUES (100.5, 500.0),
       (150.75, 800.0),
       (200.0, 1200.0),
       (175.4, 950.0),
       (225.6, 1400.0);

INSERT INTO HomeCountry
    (Name, Population, GDP, Government, DockingFee)
VALUES ('Canada', 38000000, 1643.5, 'Liberal Party - Justin Trudeau', 500.0),
       ('USA', 331000000, 21137.0, 'Democratic Party - Joe Biden', 600.0),
       ('China', 83000000, 4381.0, 'Chinese Communist Party - Xi Jinping', 550.0),
       ('Japan', 125800000, 5150.0, 'Liberal Democratic Party - Shigeru Ishiba', 580.0),
       ('Netherlands', 25600000, 1390.0, 'Independant - Dick Schoof', 470.0);

INSERT INTO ForeignCountry
    (Name, Population, GDP, Government, DockingFee)
VALUES ('Canada', 38000000, 1643.5, 'Liberal Party - Justin Trudeau', 500.0),
       ('Russia', 146000000, 1680.0, 'United Russia - Vladimir Putin', 620.0),
       ('India', 1390000000, 2875.0, 'Bharatiya Janata Party - Narendra Modi', 580.0),
       ('Brazil', 213000000, 1505.0, 'Workers Party - Luiz Inácio Lula da Silva', 490.0),
       ('UK', 67000000, 3031.0, 'Conservative Party - Rishi Sunak', 550.0);


INSERT INTO ShipmentContainer1
    (ShipOwner, ShipName, PortAddress, WarehouseSection)
VALUES ('John Shipping Co.', 'Ocean Breeze', '
999 Canada Pl, Vancouver, BC V6C 3T4', 1),
       ('Global Shipping Ltd.', 'Seawolf', 'Shengsi County, Zhoushan, China, 202461', 2),
       ('Atlantic Trade', 'Blue Horizon', 'Wilhelminakade 909, 3072 AP Rotterdam, Netherlands', 3),
       ('Pacific Vessels', 'Tidal Wave', 'Signal St, San Pedro, CA 90731, United States', 4),
       ('Maritime Enterprises', 'Northern Star', '4 - chōme - 8 Ariake, Koto City, Tokyo 135-0063, Japan', 9);

INSERT INTO ShipmentContainer2
(ShipOwner, ShipName, GoodType, ContainerSize, Weight, TrackingNumber, TradeAgreement, CompanyName, CompanyCEO)
VALUES ('John Shipping Co.', 'Ocean Breeze', 'Electronics', 45.0, 300.0, 1001, 'China - USA Agreement', 'TechCo',
        'Alice Johnson'),
       ('Global Shipping Ltd.', 'Seawolf', 'Automobiles', 50.0, 450.0, 1002, 'Canada - China Agreement', 'AutoInc',
        'Bob Smith'),
       ('Atlantic Trade', 'Blue Horizon', 'Textiles', 30.0, 200.0, 1003, 'Canada - Netherlands Agreement',
        'TextileCorp', 'Charlie Williams'),
       ('Pacific Vessels', 'Tidal Wave', 'Furniture', 60.0, 500.0, 1004, 'Canada - USA Agreement', 'FurnitureMakers',
        'David Brown'),
       ('Maritime Enterprises', 'Northern Star', 'Machinery', 55.0, 400.0, 1005, 'Canada - Japan Agreement',
        'HeavyMachines', 'Eve Davis');

INSERT INTO Company
    (CEO, Name, Industry, YearlyRevenue, CountryName)
VALUES ('Wang Chuanfu', 'BYD Auto', 'Automotive', 112000.0, 'USA'),
       ('Elliot Hill', 'Nike', 'Sportswear', 37200.0, 'USA'),
       ('Kevin Plank', 'UnderArmour', 'Sportswear', 5000.0, 'USA'),
       ('Christophe Fouquet', 'ASML Holdings', 'Technology', 29800.0, 'Netherlands'),
       ('Shuntaro Furakawa', 'Nintendo', 'Entertainment', 14000.0, 'Japan'),
       ('Mark Bristow', 'Berrick Gold', 'Mining', 11400.0, 'Canada');
