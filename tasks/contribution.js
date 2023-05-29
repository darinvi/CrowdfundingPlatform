task("contribution","Contribute funds to a campaign")
    .addParam("account","Account that contributes")
    .addParam("platform","The crowdfunding contract")
    .addParam("id","The id of the campaign")
    .addParam("value","ETH Value to send")
    .setAction(async(taskArgs, hre) => {

        const [deployer] = await hre.ethers.getSigners();
        
        const CrowdfundingPlatform = await hre.ethers.getContractFactory("CrowdfundingPlatform", deployer);

        const platform = new hre.ethers.Contract(
            taskArgs.platform,
            CrowdfundingPlatform.interface,
            await hre.ethers.getSigner(taskArgs.account)
        );

        const tx = await platform.contribute(taskArgs.id,{value: hre.ethers.utils.parseEther(taskArgs.value)});
    })