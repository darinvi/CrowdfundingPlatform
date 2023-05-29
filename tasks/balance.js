task("balance","Balance")
    .addParam("account","Get the balance of address")
    .setAction(async(taskArgs, hre) =>{
        const [deployer] = await hre.ethers.getSigners();
        const CrowdFundingPlatformFactory = await hre.ethers.getContractFactory("CrowdfundingPlatform",deployer);
        const platform = await CrowdFundingPlatformFactory.deploy();
        
        await platform.deployed();

        console.log(await hre.ethers.provider.getBalance(taskArgs.account));
    });