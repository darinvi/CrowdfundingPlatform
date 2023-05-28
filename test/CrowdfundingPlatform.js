const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { ethers } = require("hardhat");


describe("CrowdfundingPlatform", function () {
  
  let crowdfundingFirstUser, deployer, firstUser, secondUser, thirdUser;
  
  this.beforeAll(async function () {
    [deployer, firstUser, secondUser, thirdUser] = await ethers.getSigners();
    
    users = {
      0: secondUser,
      1: thirdUser
    }

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

    const goal = ethers.utils.parseEther("100");

    const creator = platform.connect(firstUser);

    return { platform, creator, goal };
  }

  
  async function createLongCampaign() {
    const { platform, creator, goal} = await loadFixture(deployAndStartCampaign);
    const twenty_four_hours = 86_400;
    await creator.createCampaign("test","description",goal,twenty_four_hours);
    return {platform}
  }


  async function createShortCampaign() {
    const { platform, creator, goal} = await loadFixture(deployAndStartCampaign);
    const five_seconds = 2;
    await creator.createCampaign("test","description",goal,five_seconds);
    return {platform}
  }


  describe("Refund", function () {
    it("Should revert if not called by creator",async function () {
      const { platform } = await loadFixture(createShortCampaign);

      const dividents = ethers.utils.parseEther("10");
      const price = ethers.utils.parseEther("1");
      
      for (let i=0; i < 2; i++){
        const currUser = platform.connect(secondUser);
        await currUser.contribute(0,{value: price});        
      }

      expect(await platform.campainGetter(0)).to.equal(ethers.utils.parseEther("2"));

      setTimeout(async ()=>{},6000);

      await crowdfundingFirstUser.refund(0);

    });
  });

  
});


function getFirstUserCrowdfunding(platform, firstUser) {
  return platform.connect(firstUser)
}
