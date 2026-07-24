# 👑 Royal Bakery — Artisanal Bakery & Confectionery UI System

An enterprise-grade, interactive web interface and reactive state management system built for **Royal Bakery**.

---

## 🌟 Key Features

- **Artisanal Product Catalog**: Categorized showcase of handcrafted breads, pastries, custom cakes, and beverages with search and filtering.
- **Interactive Shopping Cart & Real-time State**: Reactive state store (`BakeryStore`) managing item additions, quantity updates, subtotal calculations, tax, and promotions.
- **Multi-step Checkout Flow**: Order summary, fulfillment choice (pickup vs delivery), payment simulation, and order confirmation.
- **Order Tracking**: Real-time status tracker for customer orders.
- **Admin Management Portal**: Operational dashboard to manage catalog items, view orders, and handle store configurations.
- **Authentication & Roles**: User authentication manager supporting customer, staff, and admin access levels.
- **Figma-inspired UI Design**: Modern color palette featuring Cocoa (`#3A1A13`), Golden Caramel (`#B67E4B`), and Honey Gold (`#F3C387`) with responsive layouts and smooth micro-animations.

---

## 📁 Directory Structure

```
System/
├── assets/                  # Brand logo and product image assets
│   ├── logo.png
│   ├── hero-bg.png
│   ├── cinnamon-roll.png
│   ├── red-velvet-cake.png
│   └── blueberry-muffin.png
├── data/                    # Initial mock database records
│   └── mockData.ts
├── services/                # Business logic & Domain managers
│   ├── AdminManager.ts      # Admin operations & inventory control
│   ├── AuthManager.ts       # Authentication & user sessions
│   ├── CartManager.ts       # Shopping cart operations
│   ├── CatalogManager.ts    # Product catalog queries & search
│   ├── CheckoutService.ts   # Checkout processing
│   ├── ContactManager.ts    # Contact forms & customer feedback
│   └── OrderTrackingManager.ts # Order status tracking
├── state/                   # Centralized reactive state store
│   ├── BakeryStore.ts       # Main flux/redux-style state store
│   └── useBakeryStore.ts    # Custom hook interface
├── types/                   # TypeScript interface definitions
│   ├── admin.ts
│   ├── auth.ts
│   ├── cart.ts
│   ├── catalog.ts
│   ├── checkout.ts
│   ├── contact.ts
│   ├── navigation.ts
│   └── order.ts
├── demo.ts                  # Server application running the web UI portal
├── index.ts                 # Main library export entry point
├── package.json             # Node.js dependencies and script manifests
├── tsconfig.json            # TypeScript compiler configuration
└── README.md                # Project documentation
```

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn

### Installation
Clone the repository and install dependencies (if any):
```bash
npm install
```

### Running the Application
To launch the Royal Bakery UI server locally:
```bash
npm start
```
Or:
```bash
npm run dev
```

The application server will start at:
👉 `http://localhost:3000`

---

## 💻 Tech Stack

- **Language**: TypeScript / Node.js
- **State Management**: Centralized Pub/Sub Reactive Store (`BakeryStore`)
- **UI & Styling**: Vanilla HTML5, Modern CSS Design System (Custom HSL tokens, CSS Grid/Flexbox)
- **Runtime**: `tsx` (TypeScript Execution Engine)
