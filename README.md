## What Is PortObello

PortObello is a **relational database driven port logistics management system** that models international shipping operations between countries using an **Oracle Database** backend and a **Node.js/Express** API. It is meant to be clean, simple and remove guess work out of complex operations and triggers, providing seamless pulls and information visualization.

It simulates how:

- **Countries** own and operate **ports**
- **Ports** contain **warehouses** where containers are stored
- **Ships** travel along **shipping routes** between countries
- **Companies** ship **containers** using ships and warehouses
- **Tariffs / trade agreements** regulate trade relationships between nations

---

## What Makes This Project Interesting

This project goes beyond basic CRUD and demonstrates more advanced relational design and query patterns.

### Database design concepts
- **Foreign keys + referential integrity**
- **Composite primary keys** (e.g., Warehouse location keys)
- **Subtype modeling** (Country → HomeCountry / ForeignCountry)
- **Cascading behavior** in updates/deletes (depending on your schema rules)

### Query patterns / analytics
- **Aggregation queries** (grouping, averages, max/min)
- **Join queries** (e.g., Company ↔ ShipmentContainer)
- **Projection queries** (returning selected attributes only)
- **Division-style query** (trade agreements with all partners)
- **Dynamic filtering** (ship querying based on user inputs)

---

## Typical Application Flow

1. User opens the dashboard UI
2. User (optionally) initializes all tables (drop/create/seed)
3. UI fetches each table via REST endpoints and renders results dynamically
4. User can:
   - Insert/update records (e.g., countries)
   - Delete domain entities (ports, ships, companies, routes, etc.)
   - Run analytical queries and relational demonstrations
   - Explore how entities relate across the schema
  
---

## Core Domain Model

The system models 10 interconnected entities (tables) that represent the “smart port management” domain.

### 1) Country
Represents a nation and acts as the base “parent” entity.

Typical fields:
- `name` (PK)
- `population`
- `government`
- `gdp`
- `portAddress`

Used as the parent table for:
- `HomeCountry`
- `ForeignCountry`


### 2) Port
Represents port infrastructure where ships dock and cargo is processed.

Typical fields:
- `portAddress` (PK)
- `numWorkers`
- `dockedShips`
- `countryName` (FK → `Country`)


### 3) Warehouse
Represents storage locations for containers at a port.

Typical fields:
- `portAddress` (FK → `Port`)
- `warehouseSection`
- `numContainers`
- `capacity`

Common key design:
- Composite PK: (`portAddress`, `warehouseSection`)


### 4) HomeCountry
A subtype of `Country` representing countries that initiate trade agreements.

Notes:
- Implemented as a subtype/specialization of `Country`
- Often handled with logic that keeps `HomeCountry` and related entries consistent


### 5) ForeignCountry
A subtype of `Country` representing trade partner nations.

Typical fields:
- `countryName` (FK → `Country`)
- `dockingFee`


### 6) Tariff
Represents trade agreements and taxes between nations.

Relationships:
- `HomeCountry` ↔ `ForeignCountry`

Typical fields:
- `homeCountry`
- `foreignCountry`
- `agreementType`
- `taxPercent`

Enables queries like:
- “Which home countries have trade agreements with **all** foreign countries?”


### 7) ShippingRoute
Represents trade paths between countries.

Typical fields:
- `routeId` (PK)
- `originCountry`
- `destinationCountry`
- `distance`
- `estimatedTime`


### 8) Ship
Represents vessels that transport containers along routes and dock at ports.

Typical fields:
- `shipId` (PK)
- `shipName`
- `size`
- `routeId` (FK → `ShippingRoute`)
- `dockedAt` (FK → `Port`)


### 9) Company
Represents shipping/logistics companies operating in specific countries.

Typical fields:
- `companyId` (PK)
- `name`
- `countryName` (FK → `Country`)


### 10) ShipmentContainer
Represents a unit of cargo moved by a company, transported by a ship, and stored in a warehouse.

Typical fields:
- `containerId` (PK)
- `shipId` (FK → `Ship`)
- `warehousePortAddress` + `warehouseSection` (FK → `Warehouse`)
- `companyId` (FK → `Company`)
- `value`

This acts as a key “bridge” entity linking:
- **Ship ↔ Warehouse ↔ Company**

---

## Concepts Demonstrated

- Entity-relationship modeling
- Referential integrity and constraints
- Transaction-safe schema initialization (drop/create/seed patterns)
- Relational query writing:
  - `JOIN`s
  - `GROUP BY` + aggregates
  - nested queries
  - projection-style queries
  - division logic
- Dynamic query conditions and filtering
