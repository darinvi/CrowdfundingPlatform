task("deploy","Deploy")
    .addParam("account","acc address")
    .setAction(async(taskArgs, hre) =>{
        const [deployer] = await hre.ethers.getSigners();
        const CrowdFundingPlatformFactory = await hre.ethers.getContractFactory("CrowdfundingPlatform",deployer);
        
        const platform = await CrowdFundingPlatformFactory.deploy();
        
        await platform.deployed();

        console.log(`platform deployed to ${platform.address} with owner ${deployer.address}`);

        console.log(taskArgs.account);
    });