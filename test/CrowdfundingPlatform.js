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
    const five_seconds = 5;
    await creator.createCampaign("test","description",goal,five_seconds);
    return {platform}
  }


  describe("Refund", function () {
    it("Should succeed",async function () {
      const { platform } = await loadFixture(createShortCampaign);

      // const dividents = ethers.utils.parseEther("10");
      const price = ethers.utils.parseEther("1");
      
      for (const user of [secondUser,thirdUser]){
        const currUser = platform.connect(user);
        await currUser.contribute(0,{value: price});        
      }

      const crowdfundingFirstUser = await platform.connect(firstUser);

      //make sure the contributions have been succesfull.
      expect(await crowdfundingFirstUser.testCampaignGetter(0)).to.equal(ethers.utils.parseEther("2"));
      
      //wait for the short campaign to expire
      await delay(5000);
      
      await crowdfundingFirstUser.refund(0);      

      //make sure the funds have really been returned.
      expect(await crowdfundingFirstUser.testCampaignGetter(0)).to.equal(0);
      
    });
  });

  
});


async function getFirstUserCrowdfunding(platform, firstUser) {
  return platform.connect(firstUser)
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}