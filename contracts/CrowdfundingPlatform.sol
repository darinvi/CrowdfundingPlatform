// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "./Campaign.sol";

contract CrowdfundingPlatform {

    uint public currId;

    //id -> campaign
    mapping (uint => Campaign) private campaigns;

    //creator -> campaign id -> true if funds released (one creator can have more than one campaign)
    mapping (address => mapping (uint => bool)) released;

    //campaign -> all contributors
    mapping (uint => address[]) contributors;

    event campaignRefunded(uint id);

    event dividentDistribution(uint id, uint amount);

    //@notice checks if the campaign with the given id is still active.
    function checkCampainActive(uint id) internal view returns(bool){
        return block.timestamp <= campaigns[id].started() + campaigns[id].duration();
    }


    function createCampaign(
        string memory name,
        string memory description,
        uint fundingGoal,
        uint duration
    ) external {
        campaigns[currId] = new Campaign(name,description,fundingGoal,duration,msg.sender);
        currId++;
    }


    function contribute(uint id) external payable {
        Campaign campaign = campaigns[id];
        require(msg.value + campaign.totalSupply() <= campaign.maxSupply(), "Funds already raised"); 
        require(checkCampainActive(id), "Campaign has expired");
        require(!released[campaign.creator()][id],"Can't contribute to released.");

        contributors[id].push(msg.sender);
        campaign.mint(msg.sender,msg.value);
        
        //Release of funds automated, no need for the creator to worry about it
        if (campaign.totalSupply() == campaign.maxSupply()) {
            releaseOfFunds(campaign.creator(),id);
        }
    }


    function releaseOfFunds(address creator, uint id) internal {
        //No need to check if funding goal reached as I do before calling the funciton
        require(!released[creator][id],"Already released"); //check

        released[creator][id] = true;  //effect
        
        (bool success,) = creator.call{value: campaigns[id].totalSupply()}(""); //interaction
        require(success,"err");
    }


    function refund(uint id) external {
        //requires have to be implemented in the campain contract as if they were implemented here,
        //funciton calls from other places would offer possible angles for an attack vector      
        campaigns[id].refund{value: campaigns[id].totalSupply()}(contributors[id]);
        emit campaignRefunded(id);
    }

    function distribute(uint id) external payable { 
        // access control implemented in the campaign contract        
        campaigns[id].distributeDividents{value: msg.value}(contributors[id],msg.sender);
        emit dividentDistribution(id, msg.value);
    }

    //only implemented for use in tests
    function testCampaignGetter(uint id) public view returns(uint) {
        return campaigns[id].totalSupply();
    }

}