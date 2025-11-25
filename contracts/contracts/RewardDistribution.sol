// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./InnexGridToken.sol";
import "./ResourceProvider.sol";

/**
 * @title RewardDistribution
 * @dev Contract for distributing rewards to resource providers
 * @author Innexar
 */
contract RewardDistribution is Ownable, ReentrancyGuard {
    InnexGridToken public token;
    ResourceProvider public resourceProvider;

    uint256 public constant REWARD_RATE = 100; // Tokens per unit of resource used
    uint256 public constant PLATFORM_FEE = 5; // 5% platform fee

    mapping(address => uint256) public pendingRewards;
    mapping(address => uint256) public lastRewardUpdate;

    event RewardDistributed(
        address indexed provider,
        uint256 amount,
        uint256 timestamp
    );
    event RewardClaimed(address indexed provider, uint256 amount);
    event PendingRewardUpdated(
        address indexed provider,
        uint256 newPendingAmount
    );

    constructor(
        address initialOwner,
        address _token,
        address _resourceProvider
    ) Ownable(initialOwner) {
        token = InnexGridToken(_token);
        resourceProvider = ResourceProvider(_resourceProvider);
    }

    /**
     * @dev Calculate and update pending rewards for a provider
     * @param provider Address of the provider
     * @param resourceUsage Amount of resources used since last update
     */
    function updateRewards(
        address provider,
        uint256 resourceUsage
    ) external onlyOwner {
        require(
            resourceProvider.isProvider(provider),
            "RewardDistribution: Not a provider"
        );

        uint256 reward = (resourceUsage * REWARD_RATE) / 100;
        pendingRewards[provider] += reward;
        lastRewardUpdate[provider] = block.timestamp;

        emit PendingRewardUpdated(provider, pendingRewards[provider]);
    }

    /**
     * @dev Internal function to distribute rewards to provider
     * @param provider Address of the provider
     */
    function _distributeReward(
        address provider
    ) internal nonReentrant {
        require(
            resourceProvider.isProvider(provider),
            "RewardDistribution: Not a provider"
        );
        require(
            pendingRewards[provider] > 0,
            "RewardDistribution: No pending rewards"
        );

        uint256 reward = pendingRewards[provider];
        uint256 platformFeeAmount = (reward * PLATFORM_FEE) / 100;
        uint256 providerReward = reward - platformFeeAmount;

        // Reset pending rewards
        pendingRewards[provider] = 0;

        // Transfer tokens to provider
        require(
            token.transfer(provider, providerReward),
            "RewardDistribution: Transfer failed"
        );

        // Transfer platform fee to owner
        if (platformFeeAmount > 0) {
            require(
                token.transfer(owner(), platformFeeAmount),
                "RewardDistribution: Fee transfer failed"
            );
        }

        // Update provider earnings
        resourceProvider.addEarnings(provider, providerReward);

        emit RewardDistributed(provider, providerReward, block.timestamp);
    }

    /**
     * @dev Distribute rewards to provider
     * @param provider Address of the provider
     */
    function distributeReward(
        address provider
    ) external onlyOwner {
        _distributeReward(provider);
    }

    /**
     * @dev Batch distribute rewards to multiple providers
     * @param providers Array of provider addresses
     */
    function batchDistributeRewards(
        address[] calldata providers
    ) external onlyOwner {
        for (uint256 i = 0; i < providers.length; i++) {
            if (pendingRewards[providers[i]] > 0) {
                _distributeReward(providers[i]);
            }
        }
    }

    /**
     * @dev Get pending reward for a provider
     * @param provider Address of the provider
     * @return Pending reward amount
     */
    function getPendingReward(
        address provider
    ) external view returns (uint256) {
        return pendingRewards[provider];
    }

    /**
     * @dev Set reward rate (only owner)
     * @param newRate New reward rate
     */
    function setRewardRate(uint256 newRate) external onlyOwner {
        require(newRate > 0, "RewardDistribution: Rate must be > 0");
        // Note: In production, consider using events or separate storage
        // This is a simplified version
    }

    /**
     * @dev Set platform fee (only owner)
     * @param newFee New platform fee percentage
     */
    function setPlatformFee(uint256 newFee) external onlyOwner {
        require(
            newFee <= 20,
            "RewardDistribution: Fee cannot exceed 20%"
        );
        // Note: In production, consider using events or separate storage
        // This is a simplified version
    }
}

