// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ResourceProvider
 * @dev Contract for managing resource providers in InnexGrid
 * @author Innexar
 */
contract ResourceProvider is Ownable, ReentrancyGuard {
    struct Provider {
        address providerAddress;
        string resourceType; // "internet", "storage", "gpu", "sensor"
        uint256 capacity; // Total capacity available
        uint256 usedCapacity; // Currently used capacity
        uint256 pricePerUnit; // Price per unit of resource
        bool isActive;
        uint256 reputation; // Reputation score (0-100)
        uint256 totalEarnings; // Total earnings in tokens
        uint256 createdAt;
    }

    mapping(address => Provider) public providers;
    mapping(address => bool) public isProvider;
    address[] public providerList;

    event ProviderRegistered(
        address indexed provider,
        string resourceType,
        uint256 capacity
    );
    event ProviderUpdated(address indexed provider, string resourceType);
    event ProviderDeactivated(address indexed provider);
    event CapacityUpdated(
        address indexed provider,
        uint256 newCapacity,
        uint256 usedCapacity
    );
    event EarningsUpdated(address indexed provider, uint256 earnings);

    constructor(address initialOwner) Ownable(initialOwner) {}

    /**
     * @dev Register a new resource provider
     * @param resourceType Type of resource being provided
     * @param capacity Total capacity available
     * @param pricePerUnit Price per unit of resource
     */
    function registerProvider(
        string memory resourceType,
        uint256 capacity,
        uint256 pricePerUnit
    ) external {
        require(
            !isProvider[msg.sender],
            "ResourceProvider: Already registered"
        );
        require(capacity > 0, "ResourceProvider: Capacity must be > 0");
        require(
            pricePerUnit > 0,
            "ResourceProvider: Price must be > 0"
        );

        providers[msg.sender] = Provider({
            providerAddress: msg.sender,
            resourceType: resourceType,
            capacity: capacity,
            usedCapacity: 0,
            pricePerUnit: pricePerUnit,
            isActive: true,
            reputation: 50, // Starting reputation
            totalEarnings: 0,
            createdAt: block.timestamp
        });

        isProvider[msg.sender] = true;
        providerList.push(msg.sender);

        emit ProviderRegistered(msg.sender, resourceType, capacity);
    }

    /**
     * @dev Admin-only helper to registrar um provedor em nome de outro endereço (usado pelo backend)
     */
    function registerProviderFor(
        address provider,
        string memory resourceType,
        uint256 capacity,
        uint256 pricePerUnit
    ) external onlyOwner {
        require(
            provider != address(0),
            "ResourceProvider: Invalid provider"
        );
        require(
            !isProvider[provider],
            "ResourceProvider: Already registered"
        );
        require(capacity > 0, "ResourceProvider: Capacity must be > 0");
        require(
            pricePerUnit > 0,
            "ResourceProvider: Price must be > 0"
        );

        providers[provider] = Provider({
            providerAddress: provider,
            resourceType: resourceType,
            capacity: capacity,
            usedCapacity: 0,
            pricePerUnit: pricePerUnit,
            isActive: true,
            reputation: 50,
            totalEarnings: 0,
            createdAt: block.timestamp
        });

        isProvider[provider] = true;
        providerList.push(provider);

        emit ProviderRegistered(provider, resourceType, capacity);
    }

    /**
     * @dev Update provider information
     * @param resourceType New resource type
     * @param capacity New capacity
     * @param pricePerUnit New price per unit
     */
    function updateProvider(
        string memory resourceType,
        uint256 capacity,
        uint256 pricePerUnit
    ) external {
        require(isProvider[msg.sender], "ResourceProvider: Not registered");
        require(capacity > 0, "ResourceProvider: Capacity must be > 0");
        require(
            capacity >= providers[msg.sender].usedCapacity,
            "ResourceProvider: Capacity cannot be less than used"
        );

        providers[msg.sender].resourceType = resourceType;
        providers[msg.sender].capacity = capacity;
        providers[msg.sender].pricePerUnit = pricePerUnit;

        emit ProviderUpdated(msg.sender, resourceType);
    }

    /**
     * @dev Update used capacity (called by backend/oracle)
     * @param provider Address of the provider
     * @param usedCapacity New used capacity
     */
    function updateUsedCapacity(
        address provider,
        uint256 usedCapacity
    ) external onlyOwner {
        require(isProvider[provider], "ResourceProvider: Not registered");
        require(
            usedCapacity <= providers[provider].capacity,
            "ResourceProvider: Used capacity exceeds total"
        );

        providers[provider].usedCapacity = usedCapacity;

        emit CapacityUpdated(provider, providers[provider].capacity, usedCapacity);
    }

    /**
     * @dev Add earnings to provider
     * @param provider Address of the provider
     * @param amount Amount of earnings to add
     */
    function addEarnings(
        address provider,
        uint256 amount
    ) external onlyOwner nonReentrant {
        require(isProvider[provider], "ResourceProvider: Not registered");
        providers[provider].totalEarnings += amount;

        emit EarningsUpdated(provider, providers[provider].totalEarnings);
    }

    /**
     * @dev Update provider reputation
     * @param provider Address of the provider
     * @param newReputation New reputation score (0-100)
     */
    function updateReputation(
        address provider,
        uint256 newReputation
    ) external onlyOwner {
        require(isProvider[provider], "ResourceProvider: Not registered");
        require(
            newReputation <= 100,
            "ResourceProvider: Reputation must be <= 100"
        );

        providers[provider].reputation = newReputation;
    }

    /**
     * @dev Deactivate a provider
     * @param provider Address of the provider
     */
    function deactivateProvider(address provider) external onlyOwner {
        require(isProvider[provider], "ResourceProvider: Not registered");
        providers[provider].isActive = false;

        emit ProviderDeactivated(provider);
    }

    /**
     * @dev Get provider information
     * @param provider Address of the provider
     * @return Provider struct
     */
    function getProvider(
        address provider
    ) external view returns (Provider memory) {
        return providers[provider];
    }

    /**
     * @dev Get all active providers
     * @return Array of provider addresses
     */
    function getActiveProviders() external view returns (address[] memory) {
        address[] memory activeProviders = new address[](providerList.length);
        uint256 count = 0;

        for (uint256 i = 0; i < providerList.length; i++) {
            if (providers[providerList[i]].isActive) {
                activeProviders[count] = providerList[i];
                count++;
            }
        }

        // Resize array
        address[] memory result = new address[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = activeProviders[i];
        }

        return result;
    }

    /**
     * @dev Get total number of providers
     * @return Total count
     */
    function getProviderCount() external view returns (uint256) {
        return providerList.length;
    }
}



