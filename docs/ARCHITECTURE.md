# InnexGrid Architecture

## Overview

InnexGrid is a DePIN (Decentralized Physical Infrastructure Network) platform that connects resource providers with consumers using blockchain technology.

## System Architecture

```
┌─────────────────┐
│   Frontend      │
│   (Next.js)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Backend API  │
│   (Node.js)     │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌─────────┐ ┌──────────────┐
│Database │ │  Blockchain  │
│(Postgres)│ │ (Polygon)    │
└─────────┘ └──────────────┘
```

## Components

### 1. Smart Contracts (Solidity)

- **InnexGridToken.sol**: ERC20 token (INGRID)
- **ResourceProvider.sol**: Manages resource providers
- **RewardDistribution.sol**: Handles reward distribution

### 2. Frontend (Next.js + React)

- Provider dashboard
- Consumer dashboard
- Wallet integration (Web3Modal)
- Resource marketplace

### 3. Backend (Node.js + Express)

- REST API
- Blockchain integration (Ethers.js)
- Resource monitoring service
- Payment processing

### 4. Database (PostgreSQL)

- User data
- Resource usage tracking
- Transaction history
- Analytics

## Data Flow

1. Provider registers on blockchain
2. Backend monitors resource usage
3. Rewards calculated and distributed via smart contracts
4. Frontend displays real-time data

## Security

- Smart contracts use OpenZeppelin libraries
- ReentrancyGuard protection
- Access control with Ownable
- Input validation on all endpoints



