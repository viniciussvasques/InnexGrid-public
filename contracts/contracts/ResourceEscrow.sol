// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title ResourceEscrow
 * @dev Contract for managing secure payments between consumers and providers
 * @author Innexar
 */
contract ResourceEscrow is Ownable, ReentrancyGuard {
    IERC20 public token;
    address public oracle; // The gateway/backend address authorized to update usage

    struct Reservation {
        address consumer;
        address provider;
        uint256 amount;        // Total tokens deposited
        uint256 usedAmount;    // Tokens used so far
        uint256 pricePerUnit;  // Price per unit agreed upon
        uint256 startTime;
        uint256 endTime;
        bool isActive;
        bool isFinalized;
    }

    // Mapping from reservation ID (string/bytes32) to Reservation
    mapping(bytes32 => Reservation) public reservations;

    event ReservationCreated(
        bytes32 indexed reservationId,
        address indexed consumer,
        address indexed provider,
        uint256 amount
    );
    
    event UsageUpdated(
        bytes32 indexed reservationId,
        uint256 usedAmount,
        uint256 currentCost
    );

    event ReservationFinalized(
        bytes32 indexed reservationId,
        uint256 totalCost,
        uint256 refundAmount
    );

    event OracleUpdated(address indexed newOracle);

    constructor(address initialOwner, address _token, address _oracle) Ownable(initialOwner) {
        require(_token != address(0), "Invalid token address");
        require(_oracle != address(0), "Invalid oracle address");
        token = IERC20(_token);
        oracle = _oracle;
    }

    modifier onlyOracle() {
        require(msg.sender == oracle, "Caller is not the oracle");
        _;
    }

    /**
     * @dev Set a new oracle address
     */
    function setOracle(address _oracle) external onlyOwner {
        require(_oracle != address(0), "Invalid oracle address");
        oracle = _oracle;
        emit OracleUpdated(_oracle);
    }

    /**
     * @dev Create a reservation and deposit tokens
     * @param reservationId Unique identifier for the reservation
     * @param provider Address of the resource provider
     * @param amount Amount of tokens to deposit
     * @param pricePerUnit Price per unit of resource
     * @param duration Duration of the reservation in seconds
     */
    function createReservation(
        bytes32 reservationId,
        address provider,
        uint256 amount,
        uint256 pricePerUnit,
        uint256 duration
    ) external nonReentrant {
        require(provider != address(0), "Invalid provider address");
        require(amount > 0, "Amount must be > 0");
        require(reservations[reservationId].consumer == address(0), "Reservation ID already exists");

        // Transfer tokens from consumer to this contract
        require(token.transferFrom(msg.sender, address(this), amount), "Transfer failed");

        reservations[reservationId] = Reservation({
            consumer: msg.sender,
            provider: provider,
            amount: amount,
            usedAmount: 0,
            pricePerUnit: pricePerUnit,
            startTime: block.timestamp,
            endTime: block.timestamp + duration,
            isActive: true,
            isFinalized: false
        });

        emit ReservationCreated(reservationId, msg.sender, provider, amount);
    }

    /**
     * @dev Update usage and optionally release partial payment (called by Oracle/Gateway)
     * @param reservationId The reservation ID
     * @param newUsedAmount The updated usage amount (in resource units)
     */
    function updateUsage(
        bytes32 reservationId,
        uint256 newUsedAmount
    ) external onlyOracle nonReentrant {
        Reservation storage res = reservations[reservationId];
        require(res.isActive, "Reservation not active");
        require(!res.isFinalized, "Reservation finalized");

        res.usedAmount = newUsedAmount;
        
        // Calculate current cost based on usage
        // Note: Ensure decimals are handled correctly in frontend/backend
        // Assuming pricePerUnit and usage result in token amount directly or handled via scaling
        uint256 currentCost = (newUsedAmount * res.pricePerUnit); 
        
        // Safety check to not exceed deposit
        if (currentCost > res.amount) {
            currentCost = res.amount;
        }

        emit UsageUpdated(reservationId, newUsedAmount, currentCost);
    }

    /**
     * @dev Finalize reservation, pay provider, and refund consumer
     * @param reservationId The reservation ID
     * @param finalUsedAmount Final usage amount
     */
    function finalizeReservation(
        bytes32 reservationId,
        uint256 finalUsedAmount
    ) external onlyOracle nonReentrant {
        Reservation storage res = reservations[reservationId];
        require(res.isActive, "Reservation not active");
        require(!res.isFinalized, "Reservation already finalized");

        res.usedAmount = finalUsedAmount;
        res.isActive = false;
        res.isFinalized = true;

        uint256 totalCost = (finalUsedAmount * res.pricePerUnit);
        if (totalCost > res.amount) {
            totalCost = res.amount;
        }

        uint256 refund = res.amount - totalCost;

        // Pay Provider
        if (totalCost > 0) {
            require(token.transfer(res.provider, totalCost), "Provider transfer failed");
        }

        // Refund Consumer
        if (refund > 0) {
            require(token.transfer(res.consumer, refund), "Refund transfer failed");
        }

        emit ReservationFinalized(reservationId, totalCost, refund);
    }

    /**
     * @dev Allow consumer to cancel if expired and not finalized (safety mechanism)
     */
    function emergencyCancel(bytes32 reservationId) external nonReentrant {
        Reservation storage res = reservations[reservationId];
        require(msg.sender == res.consumer, "Not the consumer");
        require(res.isActive, "Not active");
        require(block.timestamp > res.endTime + 1 hours, "Grace period not over"); // 1 hour grace period

        res.isActive = false;
        res.isFinalized = true;

        // Refund full remaining amount
        // In emergency, we assume no further usage updates, so we refund what's left
        // Or strictly refund everything if usage wasn't tracked? 
        // Let's refund remaining balance based on last recorded usage.
        
        uint256 currentCost = (res.usedAmount * res.pricePerUnit);
        if (currentCost > res.amount) {
            currentCost = res.amount;
        }
        uint256 refund = res.amount - currentCost;

        if (currentCost > 0) {
            require(token.transfer(res.provider, currentCost), "Provider transfer failed");
        }
        if (refund > 0) {
            require(token.transfer(res.consumer, refund), "Refund transfer failed");
        }

        emit ReservationFinalized(reservationId, currentCost, refund);
    }
}
