# 📘 Sui Move Smart Contracts Portfolio — Level 2

## 📌 Project Overview

**Project Name:**  
**Sui Move Smart Contracts Portfolio – Level 2**

**Project Description:**  
Sui Move Smart Contracts Portfolio Level 2 is an advanced Web3 portfolio project developed for the **Move Smart Contracts Code Camp**. It evolves the Level 1 static portfolio into a fully interactive **blockchain-powered dApp** using the **Sui blockchain** and **Move smart contracts**.

This project combines:
- A responsive React frontend with wallet connectivity
- Secure authentication and admin access
- On-chain portfolio data management via Move smart contracts
- Practical Web3 transaction handling and state updates

---

## 🔗 Links

**GitHub Repository:**  
👉 https://github.com/ldcasilang/sui_portfolio_level2.git

**Deployed Website:**  
- Public Portfolio View:  
  👉 https://sui-folio.netlify.app  
- Admin CMS Dashboard:  
  👉 https://sui-folio.netlify.app/cms-admin

---

## 🚀 How to Run the Project

This project is intended to be run using **WSL (Windows Subsystem for Linux)**.

📖 **Complete setup, installation, and execution guide:**  
👉 https://docs.google.com/document/d/1NEB75rMSBGCcSsA9iX69iroe2TdUpYOmXfJMOr0tSck/edit?usp=sharing

> ⚠️ Please follow the guide carefully for:
> - Installing Sui CLI  
> - Running the Move smart contracts  
> - Setting up wallet integration  
> - Running the React frontend  
> - Admin authentication setup  

---

## ✨ Features

### 🔐 Wallet & Authentication Layer
- **Sui Wallet Integration** – Connect using Sui-compatible wallets
- **Wallet Balance Display** – Shows connected wallet’s SUI balance
- **Address Visualization** – Displays formatted wallet address
- **Admin Password Protection** – Password required to access admin dashboard

---

### 🧑‍💼 Admin Dashboard
- **Password-Protected Admin View**
- **Form-Based Input Fields** – Update portfolio data through UI
- **Real-Time Preview** – Preview changes before submitting
- **Transaction Management** – Push updates directly on-chain

---

### ⛓️ Blockchain Integration
- **Move Smart Contract Interaction** – Frontend calls on-chain functions
- **Transaction Signing** – Users sign transactions using wallet
- **Gas Fee Handling** – Automatic gas estimation
- **On-Chain State Management** – Portfolio data stored on Sui blockchain

---

## 👀 Project Visual Preview

### Portfolio View
- Public-facing portfolio page
- Displays on-chain portfolio data
- Clean and responsive UI

### Admin View
- Secure CMS-style dashboard
- Editable fields for portfolio content
- Wallet-based transaction execution

> Screenshots may be added here if required.

---

## 🗂️ Project Structure

```text
sui_portfolio_level2/
├── portfolio_contract/          # Move smart contracts
│   ├── Move.toml               # Package configuration
│   ├── sources/
│   │   └── portfolio.move      # Main Move contract
│   └── tests/
│       └── portfolio_test.move
│
└── portfolio_frontend/         # React frontend application
    ├── public/
    │   ├── profile.png         # Profile image
    │   ├── sui-logo.png        # Sui logo
    │   ├── devcon.png          # DEVCON logo
    │   └── sui.svg             # Favicon
    │
    ├── src/
    │   ├── App.tsx             # Main application component
    │   ├── App.css             # Main stylesheet
    │   ├── main.tsx            # Application entry point
    │   └── views/
    │       └── PortfolioView.tsx  # Portfolio & Admin views
    │
    ├── index.html              # Main HTML file
    ├── package.json            # Dependencies
    ├── tailwind.config.js      # Tailwind CSS config
    └── vite.config.ts          # Build configuration
