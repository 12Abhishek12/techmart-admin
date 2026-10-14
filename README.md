# TechMart | E-Commerce Admin & Order Management System

[![Node.js](https://img.shields.io/badge/Node.js-v18+-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express.js-Backend-blue.svg)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-orange.svg)](https://www.mysql.com/)
[![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3-purple.svg)](https://getbootstrap.com/)
[![License](https://img.shields.io/badge/License-MIT-lightgrey.svg)](LICENSE)

An enterprise-grade operational administrative hub and automated order lifecycle management system engineered for **TechMart**, transitioning traditional retail into a data-driven e-commerce enterprise.

---

## 📌 Business Context & Objectives
While traditional retail depends on manual bookkeeping, TechMart's 2026 operational strategy relies on a robust "Engine Room":
- **Automated Workflows**: Eliminating manual data entry through centralized inventory synchronization.
- **Transactional Consistency**: ACID-compliant stock deductions and reversals during order transitions.
- **External API Ingestion**: Pipeline to ingest external electronics catalog data into relational storage.
- **Operational Oversight**: Real-time KPI metrics for inventory turnover, low-stock triggers, and customer order fulfillment.

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: HTML5, CSS3, JavaScript (ES6+), Bootstrap 5, Bootstrap Icons
- **Backend**: Node.js, Express.js (RESTful Architecture)
- **Database**: MySQL 8.0 (Connection Pooling with `mysql2/promise`)
- **Version Control & Tooling**: Git, VS Code, Thunder Client / Postman

### Project Directory Structure
```text
techmart-admin/
├── client/                     # Frontend Admin Dashboard
│   ├── css/
│   │   └── style.css           # Custom UI styling
│   ├── js/
│   │   ├── products.js         # Inventory CRUD & KPI logic
│   │   └── orders.js           # Order workflow state machine
│   ├── index.html              # Inventory & Catalog Management UI
│   └── orders.html             # Order Fulfillment Lifecycle UI
├── server/                     # Backend API Engine
│   ├── config/
│   │   └── db.js               # MySQL Connection Pool
│   ├── controllers/
│   │   ├── productController.js# Product logic & External Ingestion
│   │   └── orderController.js  # Transactional Order Lifecycle
│   ├── routes/
│   │   ├── productRoutes.js    # /api/products endpoints
│   │   └── orderRoutes.js      # /api/orders endpoints
│   ├── .env                    # Environment configurations (Git-ignored)
│   └── server.js               # Application Entry Point
├── database/
│   └── schema.sql              # Relational DDL & schema scripts
├── .gitignore
├── package.json
└── README.md