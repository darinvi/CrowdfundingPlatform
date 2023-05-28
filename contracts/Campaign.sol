// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Campaign is ERC20 {

    string public description;
    uint public maxSupply;
    uint public duration;
    uint public started;
    address public creator;
    address[] private allContributors;

    //symbol is "MTK" for all as only name required in homework description
    constructor(
        string memory name,
        string memory _description,
        uint256 _fundingGoal,
        uint256 _duration
    ) ERC20 (name, "MTK") {
        description = _description;
        started = block.timestamp;
        maxSupply = _fundingGoal;
        duration = _duration;
        creator = msg.sender;
    }


    function mint(address to, uint256 amount) public {    
        _mint(to, amount);
        allContributors.push(to);
    }


    function refund() external payable {
        //No need to check if msg.value sufficient as I am sending .call{value: totalSupply} in the crowdFunding contract.
        //No need to validate if campaign active as already checked before calling the function in the crowdFunding contract.
        
        for (uint i=0; i <= allContributors.length; i++){
        
            address contributor = allContributors[i];
            uint balance = balanceOf(contributor);
            
            if ( balance != 0) {  //check
                _burn(contributor,balance); //effect
                (bool success, ) = address(contributor).call{value: balance}(""); //interaction
                require(success,"err");
            }
        }

        //if we get to this line without revert -> refund is succesfull so empty the array
        allContributors = new address[](0);
    }


    //@notice From what I understand, the payment must be separate from what the investors put in
    //=> the creator should insert msg.value that will be the distribution amount => payable
    
    function distributeDividents() external payable {
        for (uint i=0; i <= allContributors.length; i++) {

            address contributor = allContributors[i];
            uint balance = balanceOf(contributor);
            
            require(balance!=0,"Insufficient balance"); //check
            
            //All balances add up to the total supply => the sum off all proportions will equal 1.
            // => the sum distributed away will equal the sum injected in the payable function
            uint proportion = balance / totalSupply();
            uint distribution = proportion * msg.value;
            
            //No need for effect as the creator is giving away dividents. Only interaction required

            (bool success, ) = address(contributor).call{value: distribution}(""); //interaction
            require(success,"err");
        }
    }


}   