import { expect } from "chai";
import { ethers } from "hardhat";
import { InnexGridToken } from "../typechain-types";

describe("InnexGridToken", function () {
  let token: InnexGridToken;
  let owner: any;
  let addr1: any;
  let addr2: any;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    const InnexGridTokenFactory = await ethers.getContractFactory("InnexGridToken");
    token = await InnexGridTokenFactory.deploy(owner.address);
    await token.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await token.owner()).to.equal(owner.address);
    });

    it("Should have correct name and symbol", async function () {
      expect(await token.name()).to.equal("InnexGrid Token");
      expect(await token.symbol()).to.equal("INGRID");
    });

    it("Should have max supply", async function () {
      expect(await token.MAX_SUPPLY()).to.equal(ethers.parseEther("1000000000"));
    });
  });

  describe("Minting", function () {
    it("Should allow owner to mint tokens", async function () {
      const amount = ethers.parseEther("1000");
      await token.mint(addr1.address, amount);
      expect(await token.balanceOf(addr1.address)).to.equal(amount);
    });

    it("Should not allow minting beyond max supply", async function () {
      const maxSupply = await token.MAX_SUPPLY();
      await expect(
        token.mint(addr1.address, maxSupply + ethers.parseEther("1"))
      ).to.be.revertedWith("InnexGridToken: Max supply exceeded");
    });

    it("Should not allow non-owner to mint", async function () {
      await expect(
        token.connect(addr1).mint(addr2.address, ethers.parseEther("100"))
      ).to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");
    });
  });

  describe("Pausable", function () {
    it("Should allow owner to pause", async function () {
      await token.pause();
      expect(await token.paused()).to.be.true;
    });

    it("Should prevent transfers when paused", async function () {
      await token.mint(addr1.address, ethers.parseEther("1000"));
      await token.pause();
      
      await expect(
        token.connect(addr1).transfer(addr2.address, ethers.parseEther("100"))
      ).to.be.revertedWithCustomError(token, "EnforcedPause");
    });

    it("Should allow owner to unpause", async function () {
      await token.pause();
      await token.unpause();
      expect(await token.paused()).to.be.false;
    });
  });

  describe("Burning", function () {
    it("Should allow token holders to burn their tokens", async function () {
      const amount = ethers.parseEther("1000");
      await token.mint(addr1.address, amount);
      await token.connect(addr1).burn(ethers.parseEther("100"));
      expect(await token.balanceOf(addr1.address)).to.equal(ethers.parseEther("900"));
    });
  });
});



