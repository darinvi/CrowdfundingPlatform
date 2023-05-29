// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Campaign is ERC20 {

    uint currentDivident;
    //divident -> contributor -> received divident
    mapping (uint => mapping (address => bool)) dividentHistory;

    string public description;
    uint public maxSupply;
    uint public duration;
    uint public started;
    address public creator;
    bool public refunded = false;

    //symbol is "MTK" for all as only name required in homework description
    constructor(
        string memory name,
        string memory _description,
        uint256 _fundingGoal,
        uint256 _duration,
        address _creator
    ) ERC20 (name, "MTK") {
        description = _description;
        started = block.timestamp;
        maxSupply = _fundingGoal;
        duration = _duration;
        creator = _creator;
    }


    function mint(address to, uint256 amount) public {    
        _mint(to, amount);
    }


    function refund(address[] memory contributors) external payable {
        require(msg.value == totalSupply(),"Not enough ether");
        require(block.timestamp > started + duration,"Campaign hasn't expired");
        require(!refunded,"Already refunded");

        for (uint i=0; i < contributors.length; i++){
        
            address contributor = contributors[i];
            uint balance = balanceOf(contributor);
            
            //If there is balance, we burn the tokens and send the same value to the original owner
            if ( balance != 0) {  //check
                _burn(contributor,balance); //effect
                (bool success, ) = address(contributor).call{value: balance}(""); //interaction
                require(success,"err");
            }
        }

        //If refunded gets set to true before the actual payout loop, there would be a potential security issue.
        //A reentrancy attack would cause the require to revert and some people might not have gotten their refund.
        refunded = true;
    }



    // the creator should insert msg.value that will be distributed.
    
    function distributeDividents(address[] memory contributors, address distributor) external payable {
        require(distributor == creator, "Only the creator can distribute");
    
        for (uint i=0; i < contributors.length; i++) {

            address contributor = contributors[i];
            uint balance = balanceOf(contributor);
            
            if (!dividentHistory[currentDivident][contributor] && balance > 0){   //check
                // *100 /100 required otherwise the proportion would always be 0.
                uint proportion = balance * 100 / totalSupply();
                uint distribution = proportion * msg.value / 100;
                
                dividentHistory[currentDivident][contributor] = true; //effect      

                (bool success, ) = address(contributor).call{value: distribution}(""); //interaction
                require(success,"err");
            }
        }
        currentDivident++;
    }


}   