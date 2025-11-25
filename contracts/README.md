# InnexGrid Smart Contracts

Smart contracts for the InnexGrid DePIN platform.

## Contracts

- **InnexGridToken (INGRID)**: ERC20 token for the platform
- **ResourceProvider**: Manages resource providers and their information
- **RewardDistribution**: Handles reward distribution to providers

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy `.env.example` to `.env` and fill in your values:
```bash
cp .env.example .env
```

3. Compile contracts:
```bash
npm run compile
```

## Testing

Run tests:
```bash
npm run test
```

## Deployment

### Local Network
```bash
# Terminal 1: Start local node
npm run node

# Terminal 2: Deploy contracts
npm run deploy:local
```

### Testnet (Polygon Mumbai)
```bash
npm run deploy:testnet
```

### Mainnet (Polygon)
```bash
npm run deploy:mainnet
```

## Contract Addresses

After deployment, save the contract addresses for frontend/backend integration.

## Security

- All contracts use OpenZeppelin libraries
- ReentrancyGuard protection where needed
- Access control with Ownable
- Comprehensive test coverage required before mainnet deployment

## License

MIT



