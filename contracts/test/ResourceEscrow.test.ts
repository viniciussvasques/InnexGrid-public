import { expect } from "chai";
import { ethers } from "hardhat";
import { InnexGridToken, ResourceEscrow } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("ResourceEscrow", function () {
  let token: InnexGridToken;
  let escrow: ResourceEscrow;
  let owner: HardhatEthersSigner;
  let consumer: HardhatEthersSigner;
  let provider: HardhatEthersSigner;
  let oracle: HardhatEthersSigner;

  const INITIAL_SUPPLY = ethers.parseEther("1000000");
  const RESERVATION_AMOUNT = ethers.parseEther("100");
  const PRICE_PER_UNIT = ethers.parseEther("1");
  const DURATION = 3600; // 1 hour

  beforeEach(async function () {
    [owner, consumer, provider, oracle] = await ethers.getSigners();

    // Deploy Token
    const TokenFactory = await ethers.getContractFactory("InnexGridToken");
    const tokenDeployed = await TokenFactory.deploy(owner.address);
    await tokenDeployed.waitForDeployment();
    token = tokenDeployed as unknown as InnexGridToken;

    // Mint tokens to consumer
    await token.mint(consumer.address, INITIAL_SUPPLY);

    // Deploy Escrow
    const EscrowFactory = await ethers.getContractFactory("ResourceEscrow");
    const escrowDeployed = await EscrowFactory.deploy(owner.address, await token.getAddress(), oracle.address);
    await escrowDeployed.waitForDeployment();
    escrow = escrowDeployed as unknown as ResourceEscrow;

    // Approve escrow to spend consumer tokens
    await token.connect(consumer).approve(await escrow.getAddress(), ethers.MaxUint256);
  });

  describe("Reservation", function () {
    it("Should create a reservation successfully", async function () {
      const reservationId = ethers.encodeBytes32String("res-1");
      
      await expect(
        escrow.connect(consumer).createReservation(
          reservationId,
          provider.address,
          RESERVATION_AMOUNT,
          PRICE_PER_UNIT,
          DURATION
        )
      )
        .to.emit(escrow, "ReservationCreated")
        .withArgs(reservationId, consumer.address, provider.address, RESERVATION_AMOUNT);

      const res = await escrow.reservations(reservationId);
      expect(res.consumer).to.equal(consumer.address);
      expect(res.provider).to.equal(provider.address);
      expect(res.amount).to.equal(RESERVATION_AMOUNT);
      expect(res.isActive).to.be.true;
    });

    it("Should fail if amount is 0", async function () {
      const reservationId = ethers.encodeBytes32String("res-fail");
      await expect(
        escrow.connect(consumer).createReservation(
          reservationId,
          provider.address,
          0,
          PRICE_PER_UNIT,
          DURATION
        )
      ).to.be.revertedWith("Amount must be > 0");
    });
  });

  describe("Usage Update", function () {
    const reservationId = ethers.encodeBytes32String("res-usage");

    beforeEach(async function () {
      await escrow.connect(consumer).createReservation(
        reservationId,
        provider.address,
        RESERVATION_AMOUNT,
        PRICE_PER_UNIT,
        DURATION
      );
    });

    it("Should allow oracle to update usage", async function () {
      const usedAmount = 10n;
      const expectedCost = usedAmount * PRICE_PER_UNIT;

      await expect(
        escrow.connect(oracle).updateUsage(reservationId, usedAmount)
      )
        .to.emit(escrow, "UsageUpdated")
        .withArgs(reservationId, usedAmount, expectedCost);

      const res = await escrow.reservations(reservationId);
      expect(res.usedAmount).to.equal(usedAmount);
    });

    it("Should prevent non-oracle from updating usage", async function () {
      await expect(
        escrow.connect(consumer).updateUsage(reservationId, 10n)
      ).to.be.revertedWith("Caller is not the oracle");
    });
  });

  describe("Finalization", function () {
    const reservationId = ethers.encodeBytes32String("res-final");

    beforeEach(async function () {
      await escrow.connect(consumer).createReservation(
        reservationId,
        provider.address,
        RESERVATION_AMOUNT,
        PRICE_PER_UNIT,
        DURATION
      );
    });

    it("Should finalize and distribute tokens correctly", async function () {
      const usedAmount = 50n; // 50 units
      const totalCost = usedAmount * PRICE_PER_UNIT; // 50 tokens
      const refund = RESERVATION_AMOUNT - totalCost; // 100 - 50 = 50 tokens

      const initialProviderBalance = await token.balanceOf(provider.address);
      const initialConsumerBalance = await token.balanceOf(consumer.address);

      await expect(
        escrow.connect(oracle).finalizeReservation(reservationId, usedAmount)
      )
        .to.emit(escrow, "ReservationFinalized")
        .withArgs(reservationId, totalCost, refund);

      // Check balances
      expect(await token.balanceOf(provider.address)).to.equal(initialProviderBalance + totalCost);
      expect(await token.balanceOf(consumer.address)).to.equal(initialConsumerBalance + refund);

      const res = await escrow.reservations(reservationId);
      expect(res.isActive).to.be.false;
      expect(res.isFinalized).to.be.true;
    });
  });
});
