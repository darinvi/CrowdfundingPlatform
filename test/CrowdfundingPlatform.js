const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { expectRevert } = require("@openzeppelin/test-helpers");
const ether = require("@openzeppelin/test-helpers/src/ether");


describe("CrowdfundingPlatform", function () {
  
  let crowdfundingFirstUser, deployer, firstUser, secondUser, thirdUser;
  
  this.beforeAll(async function () {
    [deployer, firstUser, secondUser, thirdUser] = await ethers.getSigners();
    
    const { platform } = await loadFixture(deployAndStartCampaign);
    crowdfundingFirstUser = getFirstUserCrowdfunding(platform, firstUser);
  })

  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployAndStartCampaign() {
    // Contracts are deployed using the first signer/account by default
    
    const CrowdfundingPlatformFactory = await ethers.getContractFactory("CrowdfundingPlatform", deployer);
    const platform = await CrowdfundingPlatformFactory.deploy();

    //ethers.utils.parseEther(val) used many times so returning it from toWei
    const goal = toWei("100");

    const creator = platform.connect(firstUser);

    return { platform, creator, goal };
  }

  async function createShortCampaign() {
    const { platform, creator, goal} = await loadFixture(deployAndStartCampaign);
    const five_seconds = 5;
    await creator.createCampaign("test","description",goal,five_seconds);
    return {platform}
  }

  async function makeContributions() {
    const {platform} = await loadFixture(createShortCampaign)
    
    // const dividents = toWei("10");
    const price = toWei("1");
    
    for (const user of [secondUser,thirdUser]){
      const currUser = platform.connect(user);
      await currUser.contribute(0,{value: price});        
    }

    return {platform}
  }

  describe("Refund", function () {
    it("Should succeed",async function () {
      const { platform } = await loadFixture(makeContributions);

      const crowdfundingFirstUser = await platform.connect(firstUser);

      //make sure the contributions have been succesfull.
      expect(await crowdfundingFirstUser.testTotalSupplyGetter(0)).to.equal(toWei("2"));
      
      //wait for the short campaign to expire
      await delay(5000);
      
      await crowdfundingFirstUser.refund(0);      

      //make sure the funds have really been returned.
      expect(await crowdfundingFirstUser.testTotalSupplyGetter(0)).to.equal(0);
      
    });
  });

  describe("Distributions", function () {
    it("Should revert if not called by creator",async function () {

      const { platform } = await loadFixture(makeContributions);
      const currUser = await platform.connect(secondUser);
      
      const price = toWei("5");
      
      try {
        await currUser.distribute(0, {value: price});
      } 
      catch (error) {
        expectRevert(error, "Only the creator can distribute");
      }
    });
    
    it("should succeed",async function () {
      const { platform } = await loadFixture(makeContributions);
      
      //connecting the creator after making contributions with other accounts
      const crowdfundingFirstUser = platform.connect(firstUser);
      
      //first calling 
      let balance = BigInt(await ethers.provider.getBalance(secondUser.address));

      await expect(balance < toWei("10000")).to.equal(true);

      await crowdfundingFirstUser.distribute(0, {value: toWei("10")});
      
      balance = BigInt(await ethers.provider.getBalance(secondUser.address));
      await expect(balance > toWei("10000")).to.equal(true);
      
    });


  });
});


async function getFirstUserCrowdfunding(platform, firstUser) {
  return platform.connect(firstUser)
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toWei(val) {
  return ethers.utils.parseEther(val);
}