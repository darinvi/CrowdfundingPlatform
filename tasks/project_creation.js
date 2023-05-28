const { task } = require("hardhat/config");

task("project-creation","Creates a new project")
    .addParam("platform","The crowdfunding contract")
    .addParam("name", "The name of the campaign")
    .addParam("description","Description for the campaign")
    .addParam("goal","Goal for fundraising")
    .addParam("duration","Duration in seconds")
    .setAction(async(taskArgs, hre) => {


        const [deployer] = await hre.ethers.getSigners();
        
        const CrowdfundingPlatform = await hre.ethers.getContractFactory("CrowdfundingPlatform", deployer);
        
        const platform = new hre.ethers.Contract(
            taskArgs.platform,
            CrowdfundingPlatform.interface,
            deployer
        );

        const tx = await platform.createCampaign(taskArgs.name,taskArgs.description,taskArgs.goal,taskArgs.duration);
    })