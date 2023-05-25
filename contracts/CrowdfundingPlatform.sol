// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

contract CrowdfundingPlatform {

    uint public currentId = 1;

    mapping (uint => Campaign) private campains;
    mapping (uint => mapping (address => uint)) private contributors;

    struct Campaign {
        string name;
        string description;
        uint goal;
        uint raised;
        uint started;
        uint duration;
        address owner;
        bool finalized;
    }


    function startCampain(string memory name, string memory description, uint goal, uint duration) public {

        campains[currentId] = Campaign({
            name: name,
            description: description,
            goal: goal,
            raised: 0,
            started: block.timestamp,
            duration: duration,
            owner: msg.sender,
            finalized: false
        });

        currentId ++;
    }


    function contribute(uint id) public payable {
        require(msg.value <= campains[id].goal - campains[id].raised, 'Goal will be exceeded with this contribution');
        require(block.timestamp < campains[id].started + campains[id].duration, 'Campain has expired');
        
        campains[id].raised += msg.value;
        contributors[id][msg.sender] += msg.value;

        if (campains[id].goal == campains[id].raised){
            require(!campains[id].finalized,'Already paid');
            campains[id].finalized = true;
            releaseOfFunds(campains[id].owner, campains[id].goal);
        }

    }


    function releaseOfFunds(address target, uint amount) internal {
        (bool success,) = payable(target).call{value: amount}('');
        require(success,'error');
    }


    function refund(uint id) public {
        require(block.timestamp > campains[id].started + campains[id].duration, 'Campain not finished yet');
        require(contributors[id][msg.sender]>0,'Not a contributor for the given campain');

        uint sum = contributors[id][msg.sender];
        delete contributors[id][msg.sender];
        releaseOfFunds(msg.sender,sum);

    }

}