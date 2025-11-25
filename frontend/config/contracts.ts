// Endereços dos contratos - atualizar conforme deploy
export const contractAddresses = {
  resourceProvider: '0x8A791620dd6260079BF849Dc5567aDC3F2FdC318', // Endereço do ResourceProvider.sol
  innexGridToken: '0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6', // Endereço do InnexGridToken.sol
  rewardDistribution: '0x610178dA211FEF7D417bC0e6FeD39F05609AD788', // Endereço do RewardDistribution.sol
}

// ABIs dos contratos (copiar do artifacts do Hardhat)
export const resourceProviderABI = [
  {
    "inputs": [
      {
        "internalType": "uint8",
        "name": "resourceType",
        "type": "uint8"
      },
      {
        "internalType": "uint256",
        "name": "capacity",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "pricePerUnit",
        "type": "uint256"
      }
    ],
    "name": "registerProvider",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "providerAddress",
        "type": "address"
      }
    ],
    "name": "getProvider",
    "outputs": [
      {
        "components": [
          {
            "internalType": "address",
            "name": "providerAddress",
            "type": "address"
          },
          {
            "internalType": "uint8",
            "name": "resourceType",
            "type": "uint8"
          },
          {
            "internalType": "uint256",
            "name": "capacity",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "usedCapacity",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "pricePerUnit",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "isActive",
            "type": "bool"
          },
          {
            "internalType": "uint256",
            "name": "reputation",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "totalEarnings",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "createdAt",
            "type": "uint256"
          }
        ],
        "internalType": "struct ResourceProvider.Provider",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "providerAddress",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "usedCapacity",
        "type": "uint256"
      }
    ],
    "name": "updateUsedCapacity",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "providerAddress",
        "type": "address"
      }
    ],
    "name": "distributeReward",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
]

// Tipos de recursos mapeados
export const resourceTypes = {
  compute: 0,
  storage: 1,
  bandwidth: 2,
  sensor: 3,
} as const

// Objetos de contrato completos
export const resourceProviderContract = {
  address: contractAddresses.resourceProvider as `0x${string}`,
  abi: resourceProviderABI,
}

export const innexGridTokenContract = {
  address: contractAddresses.innexGridToken as `0x${string}`,
  abi: [], // TODO: adicionar ABI do token
}

export const rewardDistributionContract = {
  address: contractAddresses.rewardDistribution as `0x${string}`,
  abi: [], // TODO: adicionar ABI de rewards
}
